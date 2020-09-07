const request = require('request-promise');
const cheerio = require('cheerio');
const excel = require('excel4node');
//, openDevTools: { detach: true }

const Nightmare = require('nightmare');
const nightmare = Nightmare({
    show: true,
    webPreferences: {
        images: false
    }
});

const mainURL = 'https://avtoapteka.net.ua/';



module.exports = {
    getMainLinks:async function(){

        //get links 

        await nightmare.goto(mainURL);
        let links = await nightmare.evaluate(()=>{

            let temp =  document.querySelectorAll('a[class="nsmenu-parent-title"]');

            let data = [];

            for(let i = 0;i<temp.length;i++){
                data.push(temp[i].href);
            }

            return data;
        });

      return links;
    },


    getProducts:async function (categoryes){
              
             let total = [];
             console.log(total);
                for(let category of categoryes){
                    
                    let prods = [];

                    for(let product of category){
            
                        await nightmare.goto(product)
                            .catch(err=>console.log(err));
                        let isUndef = false;
                    
                        let prod = await nightmare.evaluate(()=>{



                        
                        //selectors here


                        /*
                            Для дебила
                            document.querySelectorAll('div[class="description"] > div > span')
                        */
                       
                            
                        
                        try{
                            var description = document.querySelector('div[id="tab-description"]').innerText;
                        }catch(e){description = "no description"}

                        try{
                            var features =    document.querySelectorAll('div[id="tab-attribute"] > table > tbody > tr');
                        }catch(e){features = "no features"}

                        try{
                            var price =       document.querySelector('div[class="price"] > span > span').innerText;
                        }catch(e){price = "no price"}

                        try{
                            var name =        document.querySelector('h1[itemprop="name"]').innerText;
                        }catch(e){name = "no name"}

                        try{
                            var producer =    document.querySelector('span[itemprop="brand"]').innerText;
                        }catch(e){producer = "no producer"}

                        try {
                            var code =        document.querySelector('div[class="description"] > div > span:nth-child(8)').innerText
                        }catch(e){code = "no code"}

                        try {
                            var country =     document.querySelector('div[class="description"] > div > span:nth-child(4)').nextSibling.textContent
                        }catch(e){country = "no country"}
                        
                            
                            let featureObject = {};
                            features.forEach(feature=>{
                                let key = feature.cells[0].innerText;
                                let value = feature.cells[1].innerText;

                                featureObject[key] = value;
                            });




                            

                            let resolvedProduct = {
                                description,
                                featureObject,
                                price,
                                name,
                                producer,
                                code,
                                country
                            };

                            return resolvedProduct;  
                    
                        }).catch(err=>isUndef = true);
                        if(!isUndef){
                            prods.push(prod);
                        }
                    }
                    total.push(prods);
                
                }
            
            console.log('Got products');
            return total;
        },


        
    

    getLinksTotal:async function (pairs){
                 console.log('Getting totalLinks...');
                 let totalLinks = [];

                 for(let pair of pairs){
                    if(pair.amount){
                        await nightmare.goto(pair.link.concat(`?limit=${pair.amount}`))
                            .catch((err)=>console.log(err));
        
                
                        let products = await nightmare.evaluate(()=>{

                            let res = [];
                            let links = document.querySelectorAll('div[class="name"] > a')


                            for(let i = 0;i<links.length;i++){
                                res.push(links[i].href);
                            }

                            return res;
                        }).catch(err=>console.log(err));

                     totalLinks.push(products);
                    }
                }
    console.log('Got it');
    return totalLinks;

},








scanOnAmountProduct:async function (links){  
                    console.log('Scaning amount...');      
                    let numbersOfProducts = [];

                    //visit each link
                    for (let link of links){
                        link = link.concat('?limit=1');
                        const response = await request({
                            uri:link,
                            headers:{
                                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.130 Safari/537.36',
                                'method': 'GET'
                            },
                        });

                    let $ = cheerio.load(response);






    

                    if(!$('div[class="col-lg-3 col-md-4 col-sm-6 col-xs-12"]   >   div[class="cat-plus-subcat"]').length){

                    
                        let textN = $('div[class="pagination"] > div[class="results"]').text();
                        let pointerStart = textN.indexOf('из');
                        let pointerEnd = textN.indexOf('(');
                    


                        link = link.replace('?limit=1','');
                        let obj = {};
                        obj.link = link;
                        obj.amount = Number(textN.slice(pointerStart+3,pointerEnd-1));
                        numbersOfProducts.push(obj);
                    }
    
    
    
                    else{


                       let subcats = $('div[class="cat-plus-subcat"] > div > a');

                           for(let i = 0; i<subcats.length;i++){
                               subcats[i] = subcats[i].attribs.href;
                           }


                       for (let i = 0; i<subcats.length;i++){
                           link = subcats[i];
                           const responseInner = await request({
                                  uri:link,
                                  headers:{
                                      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.130 Safari/537.36',
                                      'method': 'GET'
                                   },
                               });
                           
                           
                           
                           let $ = cheerio.load(responseInner);
                           
                           let textN = $('div[class="pagination"] > div[class="results"]').text();
                           let pointerStart = textN.indexOf('из');
                           let pointerEnd = textN.indexOf('(');

                            link = link.replace('?limit=1','');

                            let obj = {};
                            obj.link = link;
                            obj.amount = Number(textN.slice(pointerStart+3,pointerEnd-1));
                            numbersOfProducts.push(obj);
                        }

                    }

                    }



                console.log('Site was scaned');
                return numbersOfProducts;
},





writeIntoFile:async function(data,fileName){
              console.log(data);

              console.log('Writing into a file...');
              let workbook = new excel.Workbook();
              let style = workbook.createStyle({
                  font: {
                    color: '#000000',
                    size: 15
                  },
                  numberFormat: '$#,##0.00; ($#,##0.00); -'
                });
              
     



              let i = 0;
              for(let category of data){
              let worksheet = workbook.addWorksheet(i);
              const titles = ['Код','Производитель','Артикул','Название','Цена','Страна','Характеристики','Описание'];
              titles.forEach((title, index)=>{
                  worksheet.cell(1,index+1).string(title).style(style);
              })


            let row = 2;
            let column =  1;
            for(let product of category){

                let {code, producer, name, price, country, featureObject, description} = product;

                let feature = JSON.stringify(featureObject).replace("{","").replace("}","");



                worksheet.cell(row,column).string(code).style(style);
                worksheet.cell(row,column+1).string(producer).style(style);
                worksheet.cell(row,column+2).string(code).style(style);
                worksheet.cell(row,column+3).string(name).style(style);
                worksheet.cell(row,column+4).string(price).style(style);
                worksheet.cell(row,column+5).string(country).style(style);
                worksheet.cell(row,column+6).string(feature).style(style);
                worksheet.cell(row,column+7).string(description).style(style);
            
                column =  1;

                row++;
             }

            }
        
        fileName = fileName.concat('.xlsx');
        workbook.write(fileName);
        console.log('Finished');
    
    }
}



