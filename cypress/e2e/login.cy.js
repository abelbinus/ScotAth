describe('Login Page Tests', () => {
  const apiUrl = "http://localhost:5912"; // Set your API endpoint here

  beforeEach(() => {
    // Visit the login page before each test
    cy.visit(apiUrl  + '/login');
  });

  it('should show an error message when the username or password is empty', () => {
    // Attempt to submit the form without entering any credentials
    cy.get('.login-form-button').click();

    // Verify the error message for the username field
    cy.get('.ant-form-item-explain-error')
      .should('contain', 'Please input your username!');

    // Verify the error message for the password field
    cy.get('.ant-form-item-explain-error')
      .should('contain', 'Please input your Password!');
  });

  it('should show an error message when the username or password is empty', () => {
    // Attempt to submit the form without entering any credentials
    cy.get('.login-form-button').click();

    // Verify the error message for the username field
    cy.get('.ant-form-item-explain-error')
      .should('contain', 'Please input your username!');

    // Verify the error message for the password field
    cy.get('.ant-form-item-explain-error')
      .should('contain', 'Please input your Password!');
  });

  it('should show an error message for invalid credentials', () => {

    // Verify the presence of the username input field
    cy.get("input[placeholder=\"User Name\"]").type("wrongUser");

    // Verify the presence of the password input field
    cy.get("input[placeholder=\"Password\"]").type("wrongPassword");

    // Check if the login button is present
    cy.get('.login-form-button').should('exist').and('contain', 'Log in').click();

    // Check if the error message is displayed
    cy.get('.ant-message-error').should('contain', 'Invalid username or password');
  });

  it('should display the login form with all necessary fields', () => {
    // Check if the login form is visible
    cy.get('[data-testid="login_form"]').should('be.visible');

    // Verify the presence of the username input field
    cy.get("input[placeholder=\"User Name\"]").type("abj");

    // Verify the presence of the password input field
    cy.get("input[placeholder=\"Password\"]").type("abeladmin");

    // Check if the login button is present
    cy.get('.login-form-button').should('exist').and('contain', 'Log in').click();
    cy.contains('User Management');
  });

})