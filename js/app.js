//webkitURL is deprecated but nevertheless
URL = window.URL || window.webkitURL;

var gumStream; 						//stream from getUserMedia()
var rec; 							//Recorder.js object
var input; 							//MediaStreamAudioSourceNode we'll be recording

// shim for AudioContext when it's not avb. 
var AudioContext = window.AudioContext || window.webkitAudioContext;
var audioContext //audio context to help us record

var recordButton = document.getElementById("recordButton");
var stopButton = document.getElementById("stopButton");
var pauseButton = document.getElementById("pauseButton");

//add events to those 2 buttons
recordButton.addEventListener("click", startRecording);
stopButton.addEventListener("click", stopRecording);
pauseButton.addEventListener("click", pauseRecording);


var vocab = new Set(['a','cat','of','peck','peppers','peter','picked','pickled','piper','the',"where's"])

function startRecording() {
    console.log("recordButton clicked");

    /*
      Simple constraints object, for more advanced audio features see
      https://addpipe.com/blog/audio-constraints-getusermedia/
    */
    
    var constraints = { audio: true, video:false };

    /*
      Disable the record button until we get a success or fail from getUserMedia() 
    */

    recordButton.disabled = true;
    stopButton.disabled = false;
    pauseButton.disabled = false;

    /*
      We're using the standard promise based getUserMedia() 
      https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
    */

    navigator.mediaDevices.getUserMedia(constraints).then(function(stream) {
	console.log("getUserMedia() success, stream created, initializing Recorder.js ...");

	/*
	  create an audio context after getUserMedia is called
	  sampleRate might change after getUserMedia is called, like it does on macOS when recording through AirPods
	  the sampleRate defaults to the one set in your OS for your playback device
	  
	*/
	audioContext = new AudioContext();
	
	//update the format 
	document.getElementById("formats").innerHTML="Format: 1 channel pcm @ "+audioContext.sampleRate/1000+"kHz";
	
	/*  assign to gumStream for later use  */
	gumStream = stream;
	
	/* use the stream */
	input = audioContext.createMediaStreamSource(stream);
	
	/* 
	   Create the Recorder object and configure to record mono sound (1 channel)
	   Recording 2 channels  will double the file size
	*/
	rec = new Recorder(input,{numChannels:1});

	document.getElementById("reclight").setAttribute("visibility", "visible");
	//start the recording process
	rec.record();

	console.log("Recording started");

	
	

    }).catch(function(err) {
	//enable the record button if getUserMedia() fails
    	recordButton.disabled = false;
    	stopButton.disabled = true;
    	pauseButton.disabled = true
    });
}

function pauseRecording(){
    console.log("pauseButton clicked rec.recording=",rec.recording );
    if (rec.recording){
	//pause
	rec.stop();
	pauseButton.innerHTML="Resume";
	document.getElementById("pauselight").setAttribute("visibility", "visible");
    }else{
	//resume
	rec.record()
	pauseButton.innerHTML="Pause";
	document.getElementById("pauselight").setAttribute("visibility", "hidden");
    }
}

function stopRecording() {
    console.log("stopButton clicked");

    //disable the stop button, enable the record too allow for new recordings
    stopButton.disabled = true;
    recordButton.disabled = false;
    pauseButton.disabled = true;

    //reset button just in case the recording is stopped while paused
    pauseButton.innerHTML="Pause";
    
    //tell the recorder to stop the recording
    rec.stop();
    document.getElementById("reclight").setAttribute("visibility", "hidden");
    document.getElementById("pauselight").setAttribute("visibility", "hidden");
    //stop microphone access
    gumStream.getAudioTracks()[0].stop();

    //create the wav blob and pass it on to createDownloadLink
    rec.exportWAV(createDownloadLink);
}

function createDownloadLink(blob) {
	
    var url = URL.createObjectURL(blob);
    var au = document.createElement('audio');
    var li = document.createElement('li');
    var link = document.createElement('a');
    var input = document.createElement('input');


    //name of .wav file to use during upload and download (without extendion)
    var filename = new Date().toISOString();
    var UUN = document.getElementById("UUN").value.replace(/[^\w]/gi, '');
    filename = UUN + "-" + filename.replace(/:/g, '-');
    li.setAttribute("id", filename + '_li')
    
    //add controls to the <audio> element
    au.controls = true;
    au.src = url;

    input.setAttribute('type', 'text');
    input.setAttribute('placeholder', 'Write transcription here');
    input.setAttribute('id', filename + '_trn');
    
    // //save to disk link
    // link.href = url;
    // link.download = filename+".wav"; //download forces the browser to download the file using the  filename
    // link.innerHTML = "Save to disk";

    //add the new audio element to li
    li.appendChild(au);
    li.appendChild(document.createTextNode('  '));
    li.appendChild(input);
    li.appendChild(document.createTextNode('  '));
    
    //add the filename to the li
    li.appendChild(document.createTextNode(filename+".wav "))
    
    //add the save to disk link to li
    //li.appendChild(link);
    
    //upload link
    var upload = document.createElement('button');
    upload.setAttribute("id", "upload");
    upload.innerHTML = "Upload";
    upload.addEventListener("click", function(event){
	var transcript = document.getElementById(filename + '_trn').value.toLowerCase();
	transcript = transcript.replace(/[^\w\s\']/gi, '');
	var wlist = transcript.split(' ')
	
	// check empty
	if(transcript === ''){
	    alert("Empty transcription");
	    return;
	};

	// check oov
	for (i = 0; i < wlist.length; i++){
	    if(!vocab.has(wlist[i])){
		alert("Transcription has word '" + wlist[i] + "' that's out of vocabulary");
		return;
	    };
	};
	
	// upload
	var xhr=new XMLHttpRequest();
	xhr.onload=function(e) {
	    if(this.readyState === 4) {
		console.log("Server returned: ",e.target.responseText);
	    }
	};
	var blobTr = new Blob([transcript], { type: "text/plain;charset=utf-8" });
	var fd=new FormData();
	fd.append("audio_data", blob, filename);
	fd.append("text_data", blobTr, filename);
	xhr.open("POST","upload.php",true);
	xhr.send(fd);

	//put check mark
	this.style.display = 'none';
	var check = document.createElement('img');
	check.setAttribute("src", "img/check.png");
	check.setAttribute("class", "check");
	check.setAttribute("alt", "done");

	document.getElementById(filename + '_li').appendChild(check)
    })
    li.appendChild(document.createTextNode (" "))//add a space in between
    li.appendChild(upload)//add the upload link to li

    //add the li element to the ol
    recordingsList.appendChild(li);
}


var sanitizeHTML = function (str) {
    var temp = document.createElement('div');
    temp.textContent = str;
    return temp.innerHTML;
};
