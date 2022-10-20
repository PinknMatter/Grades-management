function side_close(){
    document.getElementById("mySidebar").style.width = "0%";
    document.getElementById("menu").style.display = "block";
    document.getElementsByClassName("main")[0].style.width = "100%";

}

function side_open(){
    document.getElementById("mySidebar").style.width = "18%";
    document.getElementById("menu").style.display = "none";
    document.getElementsByClassName("main")[0].style.width = "85%";

}