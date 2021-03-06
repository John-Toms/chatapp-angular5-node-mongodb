import { Component, OnInit  } from '@angular/core';
import { ActivatedRoute ,Router } from '@angular/router';


/* Importing services starts*/
import { SocketService } from './../socket.service';
import { HttpService } from './../http.service';
import { ChatService } from './../chat.service';
/* Importing services ends*/

@Component({
	selector: 'app-home',
  	templateUrl: './home.component.html',
  	styleUrls: ['./home.component.css'],
  	providers : [ChatService,HttpService,SocketService]
})
export class HomeComponent implements OnInit {
	
	/*
	* UI related variables starts
	*/
	private overlayDisplay = false;
	private selectedUserId = null;
	private selectedSocketId = null;
	private selectedUserName = null;	
	/* 
	* UI related variables ends
	*/

	/*
	* Chat and message related variables starts
	*/
	private username = null;
	private userId = null;
	private socketId = null;
	private chatListUsers = [];
	private message = '';
	private messages = [];
	/*
	* Chat and message related variables ends
	*/


	constructor( 
    	private chatService : ChatService,
		private socketService : SocketService,
		private route :ActivatedRoute,
		private router :Router
	) { }

	ngOnInit() {
	
		this.userId = this.route.snapshot.params['userid'];

		if(this.userId === '' || typeof this.userId == 'undefined') {
			this.router.navigate(['/']);
		}else{

			this.chatService.userSessionCheck(this.userId,( error, response )=>{
	    		if(error) {
	    			this.router.navigate(['/']); 
	    		}else{
	    			
	    			this.username = response.username;
					this.overlayDisplay = true;

					this.socketService.connectSocket(this.userId);

					this.socketService.getChatList(this.userId).subscribe(response => {
	      				
	      				if(!response.error) {
	      					
	      					if(response.singleUser) {


	      						if(this.chatListUsers.length > 0) {
	      							this.chatListUsers = this.chatListUsers.filter(function( obj ) {
										return obj._id !== response.chatList._id;
									});
	      						}

	      						this.chatListUsers.push(response.chatList);

	      					}else if(response.userDisconnected){
	      						this.chatListUsers = this.chatListUsers.filter(function( obj ) {
									return obj.socketId !== response.socketId;
								});
	      					}else{
	      						/* 
	      						* Updating entire chatlist if user logs in.
	      						*/
	      						this.chatListUsers = response.chatList;
	      					}
	      				}else{
	      					alert(`Chat list failure.`);
	      				}
			    	});

			    	this.socketService.receiveMessages().subscribe(response => {
			    		if(this.selectedUserId && this.selectedUserId == response.fromUserId) {
			    			this.messages.push(response);
			    			setTimeout( () =>{
			    					document.querySelector(`.message-thread`).scrollTop = document.querySelector(`.message-thread`).scrollHeight;
			    			},100);
			    		}
			    	});
			    	/* 
					* subscribing for messages statrts
					*/
			    	
	    		}
	    	});
		}
	}

	/* 
	* Method to select the user from the Chat list starts
	*/
	selectedUser(user):void{
		this.selectedUserId = user._id;
		this.selectedSocketId = user.socketId;
		this.selectedUserName = user.username;

		/* 
		* calling method to get the messages
		*/
		this.chatService.getMessages({ userId : this.userId,toUserId :user._id} , ( error , response)=>{
			if(!response.error) {
				this.messages = response.messages;
			}
		});
	}

	isUserSelected(userId:string):boolean{
		if(!this.selectedUserId) {
			return false;
		}
		return this.selectedUserId ===  userId ? true : false;
	}

	sendMessage(event){
		if(event.keyCode === 13) {
			if(this.message === '' || this.message === null) {
				alert(`Message can't be empty.`);
			}else{

				if (this.message === '') {
					alert(`Message can't be empty.`);
				}else if(this.userId === ''){
					this.router.navigate(['/']);					
				}else if(this.selectedUserId === ''){
					alert(`Select a user to chat.`);
				}else{

					const data = {
						fromUserId : this.userId,
						message : (this.message).trim(),
						toUserId : this.selectedUserId,
						toSocketId : this.selectedSocketId,
						fromSocketId : this.socketId
					}
					this.messages.push(data);
					setTimeout( () =>{
	    					document.querySelector(`.message-thread`).scrollTop = document.querySelector(`.message-thread`).scrollHeight;
	    			},100);
					
					/* 
					* calling method to send the messages
					*/
					this.message = null;
					this.socketService.sendMessage(data);
				}
			}
		}
	}

	alignMessage(userId){
		return this.userId ===  userId ? false : true;
	}


	logout(){
		this.socketService.logout({userId : this.userId}).subscribe(response => {
			this.router.navigate(['/']); /* Home page redirection */
		});
	}
	change(){
		this.router.navigate(['/change/'+this.userId]);  /* Change Password redirection */
	}

}
