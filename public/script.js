// Selects the HTML element with the class "wrapper" and stores it in the variable 'wrapper'
// This 'wrapper' element is the container for the login/register forms.
const wrapper = document.querySelector(".wrapper");

// Selects the element with the class "login-link" (usually a link to switch to the login form)
// and stores it in the variable 'loginLink'.
const loginLink = document.querySelector(".login-link");

// Selects the element with the class "register-link" (usually a link to switch to the register form)
// and stores it in the variable 'registerLink'.
const registerLink = document.querySelector(".register-link");

// Selects the element with the class "login-popup" (usually the button that opens the login popup)
// and stores it in the variable 'btnPopup'.
const btnPopup = document.querySelector(".login-popup");

// Adds a click event listener to the 'registerLink'.
// When the 'registerLink' is clicked, it adds the class 'active' to the 'wrapper' element.
// This is likely used to display the registration form (by changing the form’s visibility via CSS).
registerLink.addEventListener('click', () => {
    wrapper.classList.add('active');
});

// Adds a click event listener to the 'loginLink'.
// When the 'loginLink' is clicked, it removes the 'active' class from the 'wrapper' element.
// This is likely used to switch back to the login form (by hiding the registration form and showing the login form).
loginLink.addEventListener('click', () => {
    wrapper.classList.remove('active');
});

// Adds a click event listener to the 'btnPopup'.
// When the 'btnPopup' (login button) is clicked, it adds the 'active-popup' class to the 'wrapper' element.
// This is likely used to show the login form popup (by changing its visibility via CSS).
btnPopup.addEventListener('click', () => {
    wrapper.classList.add('active-popup');
});
