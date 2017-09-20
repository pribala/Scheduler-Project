$(document).ready(function () {
    $('.carousel.carousel-slider').carousel({ fullWidth: true });
           $('.carousel.carousel-slider').carousel({dist:0});
           window.setInterval(function(){$('.carousel').carousel('next')},2000)
    });