//const { watch } = require("fs");

App = {
    web3Provider: null,
  contracts: {},
  account: '0x0',

  //initialize the app
  init: function() {
    return App.initWeb3();
  },

  //connection of the client to the blockchain
  initWeb3: function() {
    // TODO: refactor conditional
    if (typeof web3 !== 'undefined') {
    // If a web3 instance is already provided by Meta Mask.
    App.web3Provider = web3.currentProvider;
    web3 = new Web3(App.web3Provider);
    } else {
    // Specify default instance if no web3 instance provided
    App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545'); //local blockchain instance
    web3 = new Web3(App.web3Provider);
    }
    return App.initContract();
    },

  //initialize the contract so we can interact
  initContract: function() {
    //questo funziona perchè usiamo il bs-config.json file
    $.getJSON("ERC998TopDown.json", function(composable) {
        // Instantiate a new truffle contract from the artifact
        App.contracts.ERC998TopDown = TruffleContract(composable);
        // Connect provider to interact with contract
        App.contracts.ERC998TopDown.setProvider(App.web3Provider);
    });

    $.getJSON("SampleNFT.json", function(component) {
        // Instantiate a new truffle contract from the artifact
        App.contracts.SampleNFT = TruffleContract(component);
        // Connect provider to interact with contract
        App.contracts.SampleNFT.setProvider(App.web3Provider);
        
        return App.render(); //render the content of the page
        App.listenForEvents();
    });
  },

  //     DA GESTIRE NEL CASO SI VOLESSE FARE L'AGGIORNAMENTO DELLA PAGINA QUANDO SI ACQUISTA L'OROLOGIO
  //     listenForEvents: function() {
  //     App.contracts.ERC998TopDown.deployed().then(function(instance) {
  //       // Restart Chrome if you are unable to receive this event
  //       // This is a known issue with Metamask
  //       // https://github.com/MetaMask/metamask-extension/issues/2393
  //       instance.buyEvent({}, {
  //         fromBlock: 0,
  //         toBlock: 'latest'
  //       }).watch(function(error, event) {
  //         console.log("event triggered", event)
  //         // Reload when a new watch is sold
  //         App.render();
  //       });
  //     });
  // },
    //show the content on the page
  render: function() {

      var watchInstance;
      var loader = $("#loader");
      //var watchesRow = $("watchesRow");
      //var componentsRow = $("#componentsRow");
      
        (async () => {
          try {
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            App.account = accounts[0];
            
            $("#accountAddress").html("Your Account: " + App.account);
            App.homepageLoad();

          } catch (e) {
              // Deal with the fact the chain failed
          }
      })();
    },
    
    homepageLoad : function(watches){

      //console.log(App.account);

        var watchesRow = $("#watchesRow");
        //watchesRow.empty();

        //var watchTemplate = $("#watchTemplate");
        //watchTemplate.show();

        (async () => {
          await App.contracts.ERC998TopDown.deployed().then(function(instance){
            return instance.tokenCount();
          }).then(function(tokenCount){
            console.log("Numero:"+tokenCount);

            

            for(i = 1; i < tokenCount; i++){
              var watchTemplate = $('#watchTemplate');
              console.log(i);
              App.contracts.ERC998TopDown.deployed().then(function(instance){
                console.log("Instance: "+ i);
                return instance.tokenURI(i);
              }).then(function(tokenURI){
                console.log("URI - "+ i  +": "+ tokenURI);
                $.getJSON(tokenURI, function(data) {
                  //var watchesRow = $('#watchesRow');
                  //watchTemplate.empty(); //ad ogni inizio lo resetto
                  
                    //console.log(data);
                    var Json = JSON.parse(data);
                    console.log(Json.Name);
                  
                    watchTemplate.find('#watch-name').text(Json.Name);
                    watchTemplate.find('#watch-image').attr('src', Json.Image);
                    watchTemplate.find('#watch-brand').text(Json.Brand);
                    watchTemplate.find('#watch-description').text(Json.Description);
                    watchTemplate.find('#watch-price').text(Json.Price);
                    watchTemplate.find('#btn-buy').attr('data-id', i);
                    
                    watchesRow.append(watchTemplate.html());
                    //watchTemplate.empty();

                });



                
              });
              
              $('#loader').hide();
            }

          });
        })();
         
    }
};

$(function() {
    $(window).load(function() {
      App.init();
    });
});