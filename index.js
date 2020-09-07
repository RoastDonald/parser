const PARSER = require('./PARSER');
console.log(PARSER);


(async ()=>{
let links = await PARSER.getMainLinks();
let pairs = await PARSER.scanOnAmountProduct(links);
let result = await PARSER.getLinksTotal(pairs);
let trueRes = await PARSER.getProducts(result); 
await PARSER.writeIntoFile(trueRes,'passToPRD');



})()