<?php
print_r($_FILES); //this will print out the received name, temp name, type, size, etc.


$size = $_FILES['audio_data']['size']; //the size in bytes
$input = $_FILES['audio_data']['tmp_name']; //temporary name that PHP gave to the uploaded file
$txt_input = $_FILES['text_data']['tmp_name'];
$output = $_FILES['audio_data']['name'].".wav"; //letting the client control the filename is a rather bad idea
$txt_output = $_FILES['audio_data']['name'].".txt";

//move the file from temp name to local folder using $output name
move_uploaded_file($input, "../data/" .$output);
move_uploaded_file($txt_input, "../data/" .$txt_output); 
// $file = fopen("../data/" .$output, 'w'); //creates new file
// fwrite($file, $input);
// fclose($file);

// $file = fopen("../data/" .$txt_output, 'w');
// fwrite($file, $transcription);
// fclose($file);
    ?>
