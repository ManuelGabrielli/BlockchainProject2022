//rappresenta il contract astraction in truffle
var Composable = artifacts.require("./ERC998TopDown.sol");
var Safemath = artifacts.require("./SafeMath.sol");
var sampleNFT = artifacts.require("./SampleNFT.sol");

//direttive to deploy the contract
module.exports = function(deployer) {
  deployer.deploy(Composable, 'Composable1', 'CMP1');
  deployer.deploy(Safemath);
  deployer.deploy(sampleNFT);
};

//poi nella console bisogna scrivere truffle migrate
//col comando truffle console si può interagire con lo smart constract
//Election.deployed().then(function(instance){app = instance}) con deployed si ottiene una copia del contract deployed e usiamo then per farci sopra qualcosa
//con questa riga si salva il contratto deployed nella variabile app
//con app.address si vede l'indirizzo
//con app.candidate() possiamo vedere il nome del candidato stored con il constructor


//la seconda volta che facciamo migrate ci va truffle migrate --reset, perchè i dati nella blockchain sono immutabili
//quindi così pushiamo una nuova copia dello smart contract. Anche l'address cambia.

//app.candidates(1).then(function(c){candidate = c;}) così prendo il primo candidato che poi sarà salvato nella variabile candidate
//candate is a struct e quindi dobbiamo accedere ai campi come un vettore 0 based, con candidate[0].toNumber() accedo all'ID

//con web3.eth.getAccounts(function (err, res){accounts = res}) posso ottenere gli indirizzi di tutti gli account, poi ci accedo come array


//per fare i test per vedere se ci sono bug prima di deploy bisogna creare un file nella cartella test

//con npm run dev e localhost:3000 apro il browser

//app.vote(1,{from: accounts[0]}) cosi da truffle console facciamo votare il primo account il primo candidato