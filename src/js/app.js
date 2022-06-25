App = {
  web3Provider: null,
  contracts: {},
  account: '0x0',
  childContract: '0x63369e9C4f2501CF90bafB9FbAC31b2B53Fc1fd9',


  init: async function() {
    // Load pets.
    /*$.getJSON('../pets.json', function(data) {
      var petsRow = $('#petsRow');
      var petTemplate = $('#petTemplate');

      for (i = 0; i < data.length; i ++) {
        petTemplate.find('.panel-title').text(data[i].name);
        petTemplate.find('img').attr('src', data[i].picture);
        petTemplate.find('.pet-breed').text(data[i].breed);
        petTemplate.find('.pet-age').text(data[i].age);
        petTemplate.find('.pet-location').text(data[i].location);
        petTemplate.find('.btn-adopt').attr('data-id', data[i].id);

        petsRow.append(petTemplate.html());
      }
    });

    $.csv.toArray('../../mint_contracts/watches_data.csv');*/

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

      //var watchInstance;
      var loader = $("#loader");
      //var watchesRow = $("watchesRow");
      //var componentsRow = $("#componentsRow");
      
        (async () => {
          try {
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            App.account = accounts[0];
            
            $("#accountAddress").html("Your Account: " + App.account);

            //pass to href personal area the account address
            // document.getElementById("personal_area").onclick = function(){
              
            // }
            App.homepageLoad();
            //App.componentLoad();
            //App.getPersonalId();


          } catch (e) {
              // Deal with the fact the chain failed
          }
      })();
    },
    
    homepageLoad : function(watches){

      //console.log(App.account);

        var watchesRow = $("#watchesRow");
        //watchesRow.empty();

        (async () => {
          await App.contracts.ERC998TopDown.deployed().then(function(instance){
            return instance.tokenCount();
          }).then(function(tokenCount){
            var attached = "";
            for(i = 1; i <= tokenCount; i++){
              (async () => {
              var watchTemplate = $('#watchTemplate');
              var watch = i;
                App.contracts.ERC998TopDown.deployed().then(function(instance){
                  //console.log("Instance: "+ watch);
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
                      watchTemplate.find('#watch-name').text(Json.Name);
                      watchTemplate.find('#watch-image').attr('src', Json.Image);
                      watchTemplate.find('#watch-brand').text(Json.Brand);
                      watchTemplate.find('#watch-description').text(Json.Description);
                      watchTemplate.find('#watch-price').text(Json.Price);
                      watchTemplate.find('.btn-view').attr('data-viewId', watch);
                      watchTemplate.find('.btn-buy').attr('data-buyId', watch);
                      
                      //console.log("a - " +attached);
                      watchesRow.append(watchTemplate.html());
                      //watchTemplate.empty();

                  });
                });
              $('#loader').hide();
            })();
            }

          });
        })();
         
    },

    personalAreaLoad : function(){
      var watchesRow = $("#personalRow");
      (async () => {
        await App.constract.ERC998TopDown.deployed().then(function(instance){
        }).then(function(tokenCount){
          for(i = 1; i <= tokenCount; i++){
            (async () => {
              var watch = i;
              var personalTemplate = $('#personalTemplate');
              App.contracts.ERC998TopDown.deployed.then(function(instance){
                return instance.ownerOf(watch);
              }).then(function(ownerOf){
                //se è il proprietario del token
                if(ownerOf == App.account){
                  App.contracts.ERC998TopDown.deployed().then(function(instance){
                    //console.log("Instance: "+ watch);
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
                        personalTemplate.find('.btn-view').attr('data-viewId', watch);                        
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

    componentLoad :function(){

      var componentsRow = $("#componentsRow");
      var watchId = 1; //a funzione si potrebbe passare l'indice dell'orologio
      //qui carico le informazioni dell'orologio nell'header
      App.contracts.ERC998TopDown.deployed().then(function(instance){
        return instance.tokenURI(watchId);
      }).then(function(tokenURI){
        $.getJSON(tokenURI, function(data) {
          var Json = JSON.parse(data);
          $('#watchInfoTable').find('#single-watch-id').html(watchId);
          $('#watchInfoTable').find('#single-watch-name').html(Json.Name);
          $('#watchInfoTable').find('#single-watch-brand').html(Json.Brand);
          $('#watchInfoTable').find('#single-watch-price').html(Json.Price);
          console.log(Json);
        });
      });;

      //qui vado a caricare tutti i componenti dell'orologio
      (async() => {
        App.contracts.ERC998TopDown.deployed().then(function(instance){
          console.log("A");
          return instance.getChildTokensIndexes(watchId, App.childContract); //devo capire quale indirizzo inserire
        }).then(function(ris){
          console.log("B");
          console.log("ris[0] : " + ris);
          var componentTemplate = $('#componentTemplate');
          //per ora non so come scorrere la lista degli index dei token figli, quindi visualizzo solo un figlio
          //secondo me in questo punto andrebbe messo un for per indicare l'indice dei componenti
          App.contracts.SampleNFT.deployed().then(function(ins){
            console.log("C");
            console.log("child token URI: " + ins.tokenURI(parseInt(ris[0])));
            return ins.tokenURI(parseInt(ris[0]));
            
          }).then(function(child_tokenURI){
            console.log("child token URI:" + child_tokenURI);
            $.getJSON(child_tokenURI, function(data){
              var Json = JSON.parse(data);
              
              componentTemplate.find('#component-id').text(Json.ID);
              componentTemplate.find('#component-name').text(Json.Name);
              componentTemplate.find('#component-brand').text(Json.Brand);
              componentTemplate.find('#component-manufacturer').text(Json.Manufacturer);
              componentTemplate.find('#component-image').attr('src', Json.Image);
              var date_time = Json.Data + ", time: " + Json.Time;
              componentTemplate.find('#component-date').text(date_time);
              componentTemplate.find('#component-material').text(Json.Material);
              componentTemplate.find('#component-description').text(Json.Description);

              componentsRow.append(componentTemplate.html());



            });
          });
        });

      })();

    },

    bindEvents: function(){
      $(document).on('click', "#btn-buy", App.soldWatch);
    },

    getPersonalId : function(){

      var link = $("#personal_area").attr("href");
      console.log("personal area link:" + link);
      var id_account = '/' + App.account;
      console.log(id_account);
      var link = $("#personal_area").attr("href");
      link = link + id_account;
      $("#personal_area").attr("href").text(link);
      console.log("personal area link2:" + link);
    },

    markSolded: function(){

      //questa funzione dovrebbe permettermi di marcare l'orologio come venduto

      // var watchInstance;

      // (async () => {
      //   await App.contracts.ERC998TopDown.deployed().then(function(instance){
      //     return instance.soldTokensId();
      //   }).then(function(soldTokenId){

      //     //scorro lista dei token venduti, così se il token risulta non venduto, lo setto a venduto
      //     for(i = 1; i < soldTokenId.size; i++){

      //     }
      //   })


      // })();

    },

    soldWatch: function(event){
      event.preventDefault();
      var watchId = parseInt($(event.target).data('buyId'));; //bisogna capire come passare l'id dell'orologio
      (async () => {
        await App.contracts.ERC998TopDown.deployed().then(function(instance){
          return instance.buyToken({from: account}, watchId);
        }).then(function(result){
          return App.markSolded();
        }).catch(function(err) {
          console.log(err.message);
        });
      })();

    }
};

$(function() {
    $(window).load(function() {
      App.init();
    });
});