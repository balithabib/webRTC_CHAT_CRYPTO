



window.sodium = {
    onload: async function (sodium){
      
      let key_pair = await sodium.crypto_kx_keypair('hex');
      let shared_tx_rx;
      let remote_tx;
      console.log(key_pair);
      $(function () {
        // if user is running mozilla then use it's built-in WebSocket
        window.WebSocket = window.WebSocket || window.MozWebSocket;
      //**************************************************//
      //les variables
      //**************************************************//
      
      //identifiant pour l'utilisateur
      var name; 
      //
      var user;
      // connexion à notre serveur de signalisation
      var socket = new WebSocket("ws://52.47.102.211:8080");
      //var socket = new WebSocket("ws://localhost:8080");
      
      // variables récuperer à l'aide des query selector 
      var divLogin = document.querySelector('#divlogin'); 
      var userName = document.querySelector('#username'); 
      var loginButton = document.querySelector('#loginButton');
      var send_btn =  document.querySelector('#sendBtn');
      var text_box = document.querySelector('#textBox');
      var divPrimry = document.querySelector('#divprimry');
      var localVideo = document.querySelector('#localVideo'); 
      var remoteVideo = document.querySelector('#remoteVideo'); 
      var callToUsername = document.querySelector('#callToUsername');
      var callButton = document.querySelector('#callButton'); 
      var hangUpButton = document.querySelector('#hangUpButton');
      //  variable pour l'objet RTCPeerConnection
      var localPeer;
      // variable pour le Remote RTCPeerConnection
      var remotePeer;
      // variable pour le flux stream (video et audio) 
      var stream;
      //variable pour le channel
      var data_channel;
      //historique de chat
      var chat_history = {};
      var date;
      //variable de configuration de l'objet RTCPeerconnection, on utilisent les serveurs stun/turn de Google  
      var configuration = { "iceServers": 
                    [{ "urls": "stun:stun2.1.google.com:19302" },
                    {"urls": 'turn:numb.viagenie.ca',"credential": 'muazkh',"username": 'webrtc@live.com'}]}; 
      
      //  ici on cache la page de login 
      divPrimry.style.display = "none";
      
      // pour avoir accez à la camera peut importe le navigateur
      navigator.getUserMedia = navigator.getUserMedia || navigator.mozGetUserMedia || navigator.webkitGetUserMedia;    
      
      //**************************************************//
      //les evenement du serveur de sinialisation websocket
      //**************************************************//
      
      /**
      * Un gestionnaire d'évènement onopen  détecte l'ouverture d'une connexion avec le serveur..  
      *
      * @author: Habib & Anis
      */ 
      socket.onopen = function () { 
        console.log("Connection avec le serveur de sinialisation est réussi"); 
        send({
            'type':'open',
        });
      };
      
      /**
      * Un gestionnaire d'évènement onerror (en cas d'erreur).  
      *
      * @author: Habib & Anis
      * @param {object} err : l'erreur reçu du serveur.
      */ 
      socket.onerror = function (err) { 
        console.log("error :", err); 
      };
    


      /**
      * Echange de tx a l'ouverture de data channel.  
      *
      * @author: Habib & Anis
      * 
      */
      
     
      
      function onOpenExchaangeTxKeys(){
        let shared_tx = sodium.to_hex(shared_tx_rx['sharedTx']);
        let public_key_client = {
          "type":"key_exchange",
          "message": shared_tx
        }; 
        data_channel.send(JSON.stringify(public_key_client));
      }


       
function encrypt(message, key){
      let nonce = null; 
      let enc = nonce.concat(sodium.crypto_aead_chacha20poly1305_encrypt(message,null, null, nonce, key));

      console.log("msg : " + enc + " ad: " + ad);
      console.log(key);
      console.log("----------------------------Encrypt------------------------------")
      return enc;    
 }

 function decrypt(dec, key){
  let nonce = dec.slice(0, sodium.crypto_secretbox_NONCEBYTES);
  let ciphertext = dec.slice(sodium.crypto_secretbox_NONCEBYTES);
    
  console.log(key);
  console.log("--------------------------------Decrypt------------------------------------")
  return sodium.crypto_aead_chacha20poly1305_encrypt(null,ciphertext, null,nonce, key);    
}


      /**
      * Un gestionnaire d'évènement onmessage de notre serveur de signalisation
      * en utilisant un switch pour traités plusieurs cas et types de messages.  
      *
      * @author: Habib & Anis
      * @param {object} message : le message reçu du serveur.
      */
      
    


      function chat(){
          data_channel.onopen = function (event) {
          send_btn.addEventListener("click", ()=>{
                
                //let msg = sodium.to_hex(encrypt(chat_message, remote_tx)); 
                let msg = text_box.value;
                //console.log(msg);
                let data_chat = {
                  "message" : msg,
                  "timestamp" : new Date()
                } 
                 console.log(shared_tx_rx);
                data_channel.send(JSON.stringify(data_chat));
                date = new Date();
                $('#messages').append("<div><p class='left'>"+date.getHours()+":"+date.getMinutes()+"</p><p class='send'>"+text_box.value+"</p></div>"); 
                $('#messages').animate({scrollTop : $('#messages').prop('scrollHeight') }, 250);
                text_box.value = '';
            });
            
          data_channel.onopen = function(event){
              onOpenExchaangeTxKeys();
          }
          }
      
          localPeer.ondatachannel = function (event){
            
            event.channel.onmessage = async function (event){
              var message_received = JSON.parse(event.data);
              if (message_received['type'] === "key_exchange"){
                  remote_tx = message_received['message'];   
              }else{
              //console.log("Client 2");
                
                //console.log("private: " +sodium.to_hex(shared_tx_rx['sharedRx']));
                //console.log("Public: "+sodium.to_hex(shared_tx_rx['sharedTx']));
                //console.log(message_received['message']);
                //let msg = decrypt(sodium.from_hex(message_received['message']), shared_tx_rx['sharedRx']);
                let msg = message_received['message'];
                date = new Date();
                $('#messages').append("<div><p class='right'>"+date.getHours()+":"+date.getMinutes()+"</p><p class='resv'>"+msg+"</p></div>");
                $('#messages').animate({scrollTop : $('#messages').prop('scrollHeight') }, 250);
              }
            }
          event.channel.onopen = function(event){
              onOpenExchaangeTxKeys();
          }

          }
      
      }
      
      /**
      * Un gestionnaire d'évènement onmessage de notre serveur de signalisation
      * en utilisant un switch pour traités plusieurs cas et types de messages.  
      *
      * @author: Habib & Anis
      * @param {object} message : le message reçu du serveur.
      */ 
      socket.onmessage = function (message) { 
         //console.log("Le message : ", message['data']);
         var data = JSON.parse(message['data']); 
         console.log(callToUsername['value']);
         switch(data['type']) { 
            case 'key_exchange':
                let server_pk = sodium.from_hex(data['name']);
                shared_tx_rx = sodium.crypto_kx_client_session_keys(sodium.from_hex(key_pair.publicKey),
                                                                          sodium.from_hex(key_pair.privateKey),
                                                                          server_pk);
                  
                break;
            case "login": 
              // quand quelqu'un veut nous appeler
              handleLogin(data['success']); 
              break; 
            case "offer":
              // quand l'offrer est crée
              handleOffer(data['offer'], data['name']);         
              chat();
              break; 
            case "answer": 
              // quand la repence est crée
              handleAnswer(data['answer']); 
              chat();
              break; 
            case "candidate": 
              // quand un utilisateur distant nous envoie un candidat
              handleCandidate(data['candidate']); 
              break; 
            case "leave":
              // quand un utilisateur quitte la déscussion  
              handleLeave(); 
              break; 
            default: 
              break; 
         }
      };
        
      /**
      * Fonction pour l'envoi de messages codés sous forme JSON.  
      *
      * @author: Habib & Anis
      * @this {send}
      * @param {object} message : le message à envoiyer.
      */ 
      function send(message) { 
        // affecter le nom de l'autre utilisateur peer à nos messages
        if (user) { 
          message['name'] = user; 
        } 
        // envoi du message à l'aide nde notre serveur de sinialisation
        socket.send(JSON.stringify(message)); 
      };
      
      
      
      function initRTC(){
      // création de l'homologues local à l'aide de l'objet RTCPeerConnection
                 localPeer = new RTCPeerConnection(configuration); 
                 // ajoute une nouvelle piste multimédia à l'ensemble de pistes qui sera transmise à l'autre homologue.
                  // à l'aide de  la méthode addTrack()  
                  stream.getTracks().forEach(track => localPeer.addTrack(track, stream));
                 
                
                  // La propriété ontrack est un eventHandler qui spécifie une fonction à appeller 
                  // lorsque l'événement de track se produit, indiquant qu'une piste a été ajoutée à RTCPeerConnection
                  localPeer.ontrack = function (event) { 
                    remoteVideo.srcObject = event.streams[0]; 
                };
                  // La propriété onicecandidate est un eventHandler qui spécifie une fonction qui doit
                  // livrer le candidat ICE, dont le SDP se trouve dans la propriété event.candidate
                  // à l'homologue distant via le serveur de signalisation
                 localPeer.onicecandidate = function (event) { 
                    // si l'evenement candidate est déclanché 
                    if (event.candidate) { 
                      // envoi d'un message de type candidate
                         send({ 
                            "type": "candidate", 
                            "candidate": event.candidate 
                         }); 
                    } 
                 };
                 data_channel = localPeer.createDataChannel("chat");  
      }
      //**************************************************//
      //les evenement liée au bouton de notre site
      //**************************************************//
       
      /**
      * Le code éxecuté quand l'utilisateur clique sur le bouton loginButton.  
      *
      * @author: Habib & Anis
      * @param {object} message : le message à envoiyer.
      */ 
      loginButton.addEventListener("click", function (event) { 
        name = username['value'];
        //si l'utilisateur tape un username
        if (name['length'] > 0) { 
           // envoi un message de type login avec le nom de l'utilisateur au serveur
          send({ 
            "type": "login", 
             "name": name 
          }); 
        }  
      });
      
      /**
      * Le code executé lorsque on click sur le bouton call  .  
      *
      * @author: Habib & Anis
      */ 
      callButton.addEventListener("click", function () {
          var username = callToUsername['value'];
          if(localPeer['signalingState'] === 'closed'){	
            initRTC();
          }
          //si en tape un username
          if (username['length'] > 0) {
              user = username;
              // creation de l'offre 
              localPeer.createOffer().then(function (offer) {
                // modifie la description locale associée à la connexion avec en argument l'offre crée
      
                localPeer.setLocalDescription(offer);
                // envoi d'un message de type offer au serveur 
               
                send({ 
                    "type": "offer", 
                    "offer": offer 
                }); 
              }).catch(function (error) { 
                console.log(error);
                alert("Erreur lors de la création d'une offre"); 
              }); 
          } 
      });
        
      /**
      * Le code executé lorsque on click sur le bouton hangUP.  
      *
      * @author: Habib & Anis
      */ 
      hangUpButton.addEventListener("click", function () { 
        //envoi d'un message de type leave au serveur
        send({ 
            "type": "leave" 
        });  
        // appelle de la fonction handleLeave
        handleLeave(); 
      });
      
      //**************************************************//
      //les fonctions corspondante à chaque evenement
      //**************************************************//
       
      /**
      * Fonction executé lorsque l'utilisateur est logé correctement.  
      *
      * @author: Habib & Anis
      * @this {handleLogin}
      * @param {boolean} success : oui le nom d'utilisateur est bon, sinon.
      */ 
      function handleLogin(success) { 
         if (success === false) { 
            alert("-_-  Essayez un autre nom d'utilisateur !!!"); 
         } else { 
               //le div de login sera cacher 
              divLogin.style.display = "none";
              //le div principale sera afficher 
              divPrimry.style.display = "block";
              //Démarrer une connexion entre homologues
              // obtenir le flux vidéo local
              navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(function (myStream) { 
                 stream = myStream; 
                 // affichage du flux vidéo local sur la page
                localVideo.srcObject =stream;         
                initRTC();
              }).catch (function(error) {
                //en cas d'erreur affichage de l'erreur 
                console.log(error); 
              }); 
           } 
      }
        
      /**
      * Fonction executé quand quelqu'un nous envoie une offre.  
      *
      * @author: Habib & Anis
      * @this {handleOffer}
      * @param {SDP offer} offer l'offre reçue d'un homologue distant .
      * @param {string} name le nom d'un homologue distant.
      */ 
      function handleOffer(offer, name) { 
        user = name; 
        if(localPeer['signalingState'] === 'closed'){	
          initRTC();
        }
        // cette méthode  modifie la description distante associée à la connexion.
        // cette description spécifie les propriétés de l'extrémité distante de la connexion
        localPeer.setRemoteDescription(new RTCSessionDescription(offer));
        // createAnswer est une méthode qui crée une réponse SDP à une offre reçue d'un homologue distant
        localPeer.createAnswer().then(function (answer) { 
          // modifie la description locale associée à la connexion avec en argument la réponse crée
          localPeer.setLocalDescription(answer); 
          // envoi d'un messsage de type answer au serveur
          send({ 
            "type": "answer", 
            "answer": answer 
          }); 
        }).catch(function (error) { 
          alert("Erreur lors de la création d'une réponse"); 
        }); 
      };
        
      /**
      * Fonction executé quand on reçoit une réponse d'un utilisateur distant.  
      *
      * @author: Habib & Anis
      * @this {handleAnswer}
      * @param {SDP answer} answer la réponce reçue d'un homologue distant .
      */ 
      function handleAnswer(answer) { 
        remotePeer = new RTCSessionDescription(answer)	
        // modifie la description distante associée à la connexion avec en argument la réponse reçu
        
        localPeer.setRemoteDescription(remotePeer); 
      
      };
        
      /**
      * Fonction executé quand on reçoit un candidat glace d'un utilisateur distant .  
      *
      * @author: Habib & Anis
      * @this {handleCandidate}
      * @param {candidate} candidate la cadidate qui décrit l'état de l'extrémité distante de la connexion.
      */ 
      function handleCandidate(candidate) { 
        // ajouter le nouveau candidat ICE de l'homologue distant
        // et elle envoie le candidat nouvellement reçu à l'agent ICE du navigateur.
        localPeer.addIceCandidate(new RTCIceCandidate(candidate)); 
      };
         
      /**
      * Fonction executé lorsque l'utilisateur raccrouche l'appele actuelle.  
      *
      * @author: Habib & Anis
      * @this {handleLeave}
      */ 
      function handleLeave() { 
        user = null; 
        remoteVideo.src = null; 
        localPeer.close(); 
        localPeer.onicecandidate = null; 
        localPeer.ontrack = null; 
      };
      
      
      
      });
    }
};
