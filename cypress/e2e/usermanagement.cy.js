describe('User Management Tests', () => {
  const apiUrl = "http://localhost:5912"; // Set your API endpoint here

  beforeEach(() => {
    // Visit the login page before each test
    cy.visit(apiUrl  + '/login');
    // Check if the login form is visible
    cy.get('[data-testid="login_form"]').should('be.visible');

    // Verify the presence of the username input field
    cy.get("input[placeholder=\"User Name\"]").type("abj1");

    // Verify the presence of the password input field
    cy.get("input[placeholder=\"Password\"]").type("Password123!");

    // Check if the login button is present
    cy.get('.login-form-button').should('exist').and('contain', 'Log in').click();
  });

  it('should display the login form with all necessary fields', () => {

    cy.contains('User Management');
    cy.contains('Volunteer');
    // Click on the "Admin" button
    cy.contains('Admin').should('be.visible');
  });
  it('should click on the first Edit button', () => {

    // Click on the "Admin" button
    cy.contains('Admin').should('be.visible').click();

    // Locate the first "Edit" link and click it
    cy.get('a').contains('Edit').first().click({ force: true });

    // Alternatively, you could be more specific:
    // cy.get('table .ant-table-row a').contains('Edit').first().click();

    // Check for an edit form or modal
    cy.contains('Edit User').should('be.visible');
  });
})