const console = require("console")
const fs = require("fs")
//ipfs connection
const IPFS = require('ipfs-mini')

function makeJsonUrl(ipfs, json, f, id, id_f) {
  return new Promise(function (resolve, reject){
    ipfs.addJSON(json,  (err, hash) => {
      if(err){
        return reject(console.log(err))
      }
      url = t+hash
      //write url in file
    
      f.write(id+","+url+","+id_f+"\n")
      
      
      resolve("CREATED")
    })
  })
}

async function main() {
  
  csv_components = fs.readFileSync("components_data.csv")

  
  //const { url } = require("inspector")
  const ipfs = new IPFS({ host: 'ipfs.infura.io', port: 5001, protocol: 'https' })

  var array_c = csv_components.toString().replaceAll('\r', '').split("\n")
  
  // The array[0] contains all the header columns so we store them in headers array
  let headers_c = array_c[0].split(";")

  t = "https://ipfs.infura.io/ipfs/"


  //COMPONENTS FILE CREATION
  var file2 = fs.createWriteStream('urlComponents.txt')
  file2.on('error', function(err) { console.log(err) })

  for (let i = 1; i < array_c.length - 1; i++) {
    let obj = {}
  
    let str = array_c[i]
    let s = ''
  
    let flag = 0

    for (let ch of str) {
      if (ch === '"' && flag === 0) {
        flag = 1
      }
      else if (ch === '"' && flag == 1) flag = 0
      if (ch === ';' && flag === 0) ch = '|'
      if (ch !== '"') s += ch
    }
  
    let properties = s.split("|")
  
    var id = 0
    var id_f = 0
    for (let j in headers_c) {
      if(headers_c[j] == 'Father_ID'){ 
        id_f = properties[j]
        continue;
      }
      if(headers_c[j] == 'ID'){ 
        id = properties[j]
      }
      obj[headers_c[j]] = properties[j]
    }

    let json = JSON.stringify(obj)
    
    await  makeJsonUrl(ipfs, json, file2, id, id_f)
  }

  file2.end()
}

 main()