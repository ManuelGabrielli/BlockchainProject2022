App = {
  web3Provider: null,
  contracts: {},
  account: '0x0',
  childContract: '0x368e93c7aFCc26A40f694FD86586161FD2775D5F',
  valOneEther: 1185.5,
  //prevWatchId : '0',

  init: async function() {
    return await App.initWeb3();
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
        //App.listenForEvents();
    });

    return App.bindEvents();
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

      //var watchInstance;
      var loader = $("#loader");
      
        (async () => {
          try {
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            App.account = accounts[0];
            
            $("#accountAddress").html("Your Account: " + App.account);
            $('#showWatchId').html("Watch ID " + localStorage.getItem('myId'));
            //pass to href personal area the account address
            // document.getElementById("personal_area").onclick = function(){
              
            // }
            App.homepageLoad();
            App.personalAreaLoad();
            App.componentLoad();
            App.markSold();
            //App.saveId();
            //App.getPersonalId();
            
          } catch (e) {
              // Deal with the fact the chain failed
          }
      })();
    },
    
  homepageLoad : function(){

    //console.log(App.account);

      var watchesRow = $("#watchesRow");
      //watchesRow.empty();

      (async () => {
        await App.contracts.ERC998TopDown.deployed().then(function(instance){
          return instance.tokenCount();
        }).then(function(tokenCount){
          for(i = 1; i <= tokenCount; i++){
            (async () => {
            var watchTemplate = $('#watchTemplate');
            var watch = i;
            await App.contracts.ERC998TopDown.deployed().then(function(instance){
                return instance.tokenURI(watch);
              }).then(function(tokenURI){
                $.getJSON(tokenURI, function(data) {
                    var Json = JSON.parse(data);

                    watchTemplate.find('#watch-name').text(Json.Name);
                    watchTemplate.find('#watch-image').attr('src', Json.Image);
                    watchTemplate.find('#watch-brand').text(Json.Brand);
                    watchTemplate.find('#watch-description').text(Json.Description);
                    var priceEuro = (parseInt(Json.Price) * App.valOneEther);
                    watchTemplate.find('#watch-price').text("Price:  "+Json.Price+" Ether / "+priceEuro+" Euro");
                    watchTemplate.find('.btn-view').attr('data-viewid', watch);
                    watchTemplate.find('.btn-buy').attr('data-buyid', watch);

                    
                    watchesRow.append(watchTemplate.html());
                    //console.log("a - " +attached);
                    //watchTemplate.empty();

                }); //Json read
              });

            
            $('#loader').hide();
          })();
          }

        });
      })();
        
  },

  personalAreaLoad : function(){
    var personalRow = $("#personalRow");
    (async () => {
      await App.contracts.ERC998TopDown.deployed().then(function(instance){
        return instance.tokenCount();
      }).then(function(tokenCount){
        for(i = 1; i <= tokenCount; i++){
          (async () => {
            var watch = i;
            var personalTemplate = $('#personalTemplate');
            App.contracts.ERC998TopDown.deployed().then(function(instance){
              return instance.ownerOf(watch);
            }).then(function(ownerOf){
              //se è il proprietario del token
              if(ownerOf == App.account){
                
                App.contracts.ERC998TopDown.deployed().then(function(instance){
                  return instance.tokenURI(watch);
                }).then(function(tokenURI){
                  //console.log("URI - "+ watch  +": "+ tokenURI);
                  $.getJSON(tokenURI, function(data) {
                    //var watchesRow = $('#watchesRow');
                    //watchTemplate.empty(); //ad ogni inizio lo resetto
                    
                      //console.log(data);
                      var Json = JSON.parse(data);
                      //console.log(Json.Name);
                      //attached+= " " + Json.Name + ":";
                      personalTemplate.find('#personal-watch-name').text(Json.Name);
                      personalTemplate.find('#personal-watch-image').attr('src', Json.Image);
                      personalTemplate.find('#personal-watch-brand').text(Json.Brand);
                      personalTemplate.find('#personal-watch-description').text(Json.Description);
                      personalTemplate.find('#personal-watch-price').text(Json.Price);
                      personalTemplate.find('.btn-view').attr('data-viewid', watch);                        
                      //console.log("a - " +attached);
                      personalRow.append(personalTemplate.html());
                      //watchTemplate.empty();

                  });
                });

              }
            });

          })();
        }

      });

    })();


    
  },

  componentLoad : function(){
    var componentsRow = $("#componentsRow");
    var watchId = localStorage.getItem('myId'); //assegno alla variabile che uso qui dentro watchId quella che mi sono salvata
    //watchId = 1;
    //console.log("actual id get from local storage: " + watchId);
    //console.log("local storage: " + localStorage.getItem('myId'));
    (async() => {
    await App.contracts.ERC998TopDown.deployed().then(function(instance){
      return instance.tokenURI(watchId);
    }).then(function(tokenURI){
      //console.log('scrittura su pagina da json');
      $.getJSON(tokenURI, function(data) {
        var Json = JSON.parse(data);
        $('#watchInfoTable').find('#single-watch-id').html(watchId);
        $('#watchInfoTable').find('#single-watch-name').html(Json.Name);
        $('#watchInfoTable').find('#single-watch-brand').html(Json.Brand);
        $('#watchInfoTable').find('#single-watch-price').html(Json.Price);
        //console.log(Json);

        App.contracts.ERC998TopDown.deployed().then(function(instance){
          return instance.getOwnershipCount(watchId);
        }).then(function(ownershipCount) {
          console.log("ownership count");
          for( o = 0; o < ownershipCount; o++){
            (async () => {
              var k = o;
              App.contracts.ERC998TopDown.deployed().then( function(instance){
                console. log("prev owner: " + k);
                console.log("list: " + instance.getOwnershipsList(watchId, k));
                return instance.getOwnershipsList(watchId, k);
              }).then(function(ownerList){
                console.log("ownership list inside");
                var ownerAddress = ownerList[0];
                var purchaseTime = ownerList[1];
                var date = new Date(purchaseTime * 1000);
                var hours = date.getHours();
                var minutes = "0" + date.getMinutes();
                var formattedTime = hours + ':' + minutes.substr(-2);
                var purchasePrice = ownerList[2];
                if(k >= 1){
                  $('#traceInfoTable').append('<tr><td>' + ownerAddress + '</td><td>' + formattedTime + '</td><td>'+ purchasePrice +'</td></tr>');
                }
              });
            })();
          }
        });
      });
    });
    })();

    //qui vado a caricare tutti i componenti dell'orologio
    (async() => {
      App.contracts.ERC998TopDown.deployed().then(function(instance){
        console.log("watch Id nel async del componente: " + watchId);
        return instance.getChildTokensIndexes(watchId, App.childContract); //devo capire quale indirizzo inserire
      }).then(function(ris){
        console.log("lista ris : " + ris);
        var risLength =  ris.length;
        for(i = 0; i<risLength; i++){
          (async () => {
          var c = i;
          var componentTemplate = $('#componentTemplate');
          App.contracts.SampleNFT.deployed().then(function(ins){
            return ins.tokenURI(parseInt(ris[c]));            
          }).then(function(child_tokenURI){
            $.getJSON(child_tokenURI, function(data){
              var Json = JSON.parse(data);
              //console.log(Json);
              //componentTemplate.find('#component-id').text(Json.ID);
              componentTemplate.find('#component-name').text(Json.Name);
              componentTemplate.find('#component-brand').text(Json.Brand);
              componentTemplate.find('#component-manufacturer').text(Json.Manufacturer);
              componentTemplate.find('#component-image').attr('src', Json.Image);
              var date_time = Json.Date + ", time: " + Json.Time;
              componentTemplate.find('#component-date').text(date_time);
              componentTemplate.find('#component-material').text(Json.Material);
              componentTemplate.find('#component-description').text(Json.Description);

              componentsRow.append(componentTemplate.html());
              
            }); //getJson
          }); //childTokenURI
        })();
        } //for
      });
      $('#watch-info-button').find('.btn-buy').attr('data-buyid', watchId);
      $('.buyDivText > p').attr('data-watchid', watchId);
      //$('#watch-info-button').find('button').text('Sold').attr('disabled', true);
    })();
    
    //localStorage.clear();
  },

  bindEvents: function(){
    $(document).on('click', ".btn-buy", App.sellWatch);
    //$(document).on('click', '#btn-view', this);
  },

  markSold: function(){

    (async () => {
      await App.contracts.ERC998TopDown.deployed().then(function(instance) {
        return instance.tokenCount();
      }).then(function(tokenCount){
        for(i = 1; i <= tokenCount; i++){
          (async () => {
            var watch = i;
            App.contracts.ERC998TopDown.deployed().then(function(instance) {
              return instance.isTokenSold(watch);
            }).then(function(isTokenSold) {
              console.log("is token " + watch + " sold: " + isTokenSold);
              //var example = isTokenSold;
              //example = true;
              //nel caso in cui il token è stato venduto, disabilito il bottone con id relativo a quello dell'orologio
              if(isTokenSold){
                $(".buyDiv").find(`[data-buyid='${watch}']`).text('Sold').attr('disabled', true);
                $(".buyDivText").find(`[data-watchid='${watch}']`).text("Watch is already sold");
              }
            }).catch(function(err) {
              console.log(err.message);
            });

          })();
        }
      });
    })();
    //console.log("watch sold to account " + App.account);
  },

  sellWatch: function(event){
    event.preventDefault();
    var watchId = parseInt($(event.target).data('buyid'));
    var watchPrice; //inizialmente lo settiamo a 0

    (async () => {
      await App.contracts.ERC998TopDown.deployed().then(function(instance){
        return instance.tokenURI(watchId);
      }).then(function(tokenURI){
        $.getJSON(tokenURI, function(data){
          var Json = JSON.parse(data);
          watchPrice = Json.Price;
          console.log("watch price from json: " + watchPrice);

          App.contracts.ERC998TopDown.deployed().then(function(instance){
            console.log("account: " + App.account);
            console.log("watchid to buy " + watchId);
            console.log("watch price from json in before buying: " + watchPrice);
            return instance.buyToken(watchId, {from: App.account, value:web3.toWei(watchPrice,"ether")});
           }).then(function(result){
           return App.markSold();
          }).catch(function(err) {
            console.log(err.message);
          });
        });
      
    });
    })();
  }
};

$(function() {
    $(window).load(function() {
      App.init();
    });
});