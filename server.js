const inquirer = require('inquirer');
const mysql = require('mysql2/promise');
require('dotenv').config();
let connection; 
async function startApp() {
  try {
    console.log('***********************************');
    console.log('*                                 *');
    console.log('*        EMPLOYEE MANAGER         *');
    console.log('*                                 *');
    console.log('***********************************');

    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'Thegbg123!',
      database: 'Company_db',
    });

    await promptUser();
  } catch (error) {
    console.error('Error connecting to the database:', error);
  }
}

async function promptUser() {
  try {
    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'choices',
        message: 'What would you like to do?',
        choices: [
          'View all departments',
          'View all roles',
          'View all employees',
          'Add a department',
          'Add a role',
          'Add an employee',
          'Update an employee role',
          'Update an employee manager',
          'View employees by department',
          'Delete a department',
          'Delete a role',
          'Delete an employee',
          'View department budgets',
          'No Action',
        ],
      },
    ]);

    const { choices } = answers;

    switch (choices) {
      case 'View all departments':
        await showDepartments();
        break;
      case 'View all roles':
        await showRoles();
        break;
      case 'View all employees':
        await showEmployees();
        break;
      case 'Add a department':
        await addDepartment();
        break;
      case 'Add a role':
        await addRole();
        break;
      case 'Add an employee':
        await addEmployee();
        break;
      case 'Update an employee role':
        await updateEmployee();
        break;
      case 'Update an employee manager':
        await updateManager();
        break;
      case 'View employees by department':
        await employeeDepartment();
        break;
      case 'Delete a department':
        await deleteDepartment();
        break;
      case 'Delete a role':
        await deleteRole();
        break;
      case 'Delete an employee':
        await deleteEmployee();
        break;
      case 'View department budgets':
        await viewBudget();
        break;
      case 'No Action':
        connection.end();
        break;
      default:
        console.log('Invalid choice');
        await promptUser();
        break;
    }
  } catch (error) {
    console.error('An error occurred:', error);
  }
}

const showDepartments = async () => {
  try {
    console.log('Showing all departments...\n');
    const [rows] = await connection.execute('SELECT department.id AS id, department.name AS department FROM department');
    console.table(rows);
    promptUser();
  } catch (err) {
    console.error(err);
  }
};


const showRoles = async () => {
  try {
    console.log('Showing all roles...\n');
    const [rows] = await connection.execute(
      'SELECT role.id, role.title, department.name AS department FROM role INNER JOIN department ON role.department_id = department.id');
    console.table(rows);
    promptUser();
  } catch (err) {
    console.error(err);
  }
};

const showEmployees = async () => {
  try {
    console.log('Showing all employees...\n');
    const [rows] = await connection.execute(`
      SELECT employee.id, employee.first_name, employee.last_name, role.title, department.name AS department, role.salary, CONCAT(manager.first_name, " ", manager.last_name) AS manager
      FROM employee
      LEFT JOIN role ON employee.role_id = role.id
      LEFT JOIN department ON role.department_id = department.id
      LEFT JOIN employee manager ON employee.manager_id = manager.id`);
    console.table(rows);
    promptUser();
  } catch (err) {
    console.error(err);
  }
};


const addDepartment = async () => {
  try {
    const answers = await inquirer.prompt([
      {type: 'input',
        name: 'addDept',
        message: "What department do you want to add?",
        validate: addDept => {
          if (addDept) {return true;}
           else {console.log('Please enter a department');
           return false;
          }
        }
      }
    ]);

    const [result] = await connection.execute('INSERT INTO department (name) VALUES (?)', [answers.addDept]);
    console.log(`Added ${answers.addDept} to departments!`);
    showDepartments();
  } catch (err) {
    console.error(err);
  }
};

const addRole = async () => {
  try {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'role',
        message: "What role do you want to add?",
        validate: addRole => {
          if (addRole) {return true;} 
          else {console.log('Please enter a role');
            return false;
          }
        }
      },
      {
        type: 'input',
        name: 'salary',
        message: "What is the salary of this role?",
        validate: addSalary => {
          if (!isNaN(addSalary)) {return true;} 
          else {console.log('Please enter a valid salary');
            return false;
          }
        }
      }
    ]);

    const [roleData] = await connection.execute('SELECT name, id FROM department');
    const dept = roleData.map(({ name, id }) => ({ name: name, value: id }));
    const deptChoice = await inquirer.prompt([
      {
        type: 'list',
        name: 'dept',
        message: "What department is this role in?",
        choices: dept
      }
    ]);

    const params = [answers.role, answers.salary, deptChoice.dept];

    const [result] = await connection.execute(
      'INSERT INTO role (title, salary, department_id) VALUES (?, ?, ?)',
      params
    );
    console.log(`Added ${answers.role} to roles!`);
    showRoles();
  } catch (err) {console.error(err);}
};


const addEmployee = async () => {
  try {const answers = await inquirer.prompt([
        {type: 'input',
        name: 'firstName',
        message: "What is the employee's first name?",
        validate: addFirst => {
          if (addFirst) {return true;} 
          else {console.log('Please enter a first name');
            return false;
          }
        }
      },
      {
        type: 'input',
        name: 'lastName',
        message: "What is the employee's last name?",
        validate: addLast => {
          if (addLast) {return true;} 
          else {console.log('Please enter a last name');
            return false;
          }
        }
      }
    ]);

    const [roleData] = await connection.execute('SELECT id, title FROM role');
    const roles = roleData.map(({ id, title }) => ({ name: title, value: id }));
    const roleChoice = await inquirer.prompt([
      {
        type: 'list',
        name: 'role',
        message: "What is the employee's role?",
        choices: roles
      }
    ]);

    const [managerData] = await connection.execute('SELECT id, first_name, last_name FROM employee');
    const managers = managerData.map(({ id, first_name, last_name }) => ({ name: first_name + " " + last_name, value: id }));
    const managerChoice = await inquirer.prompt([
      {
        type: 'list',
        name: 'manager',
        message: "Who is the employee's manager?",
        choices: managers
      }
    ]);

    const params = [answers.firstName, answers.lastName, roleChoice.role, managerChoice.manager];

    const [result] = await connection.execute(
      'INSERT INTO employee (first_name, last_name, role_id, manager_id) VALUES (?, ?, ?, ?)',
      params
    );
    console.log("Employee has been added!");
    showEmployees();
  } catch (err) {
    console.error(err);
  }
};


const updateEmployee = async () => {
  try {
    const [employeeData] = await connection.execute('SELECT id, first_name, last_name FROM employee');
    const employees = employeeData.map(({ id, first_name, last_name }) => ({ name: first_name + " " + last_name, value: id }));
    const empChoice = await inquirer.prompt([
      {
        type: 'list',
        name: 'name',
        message: "Which employee would you like to update?",
        choices: employees
      }
    ]);

    const [roleData] = await connection.execute('SELECT id, title FROM role');
    const roles = roleData.map(({ id, title }) => ({ name: title, value: id }));
    const roleChoice = await inquirer.prompt([
      {
        type: 'list',
        name: 'role',
        message: "What is the employee's new role?",
        choices: roles
      }
    ]);

    const params = [roleChoice.role, empChoice.name];

    const [result] = await connection.execute(
      'UPDATE employee SET role_id = ? WHERE id = ?',
      params
    );
    console.log("Employee has been updated!");
    showEmployees();
  } catch (err) {
    console.error(err);
  }
};


const updateManager = async () => {
  try {
    const [employeeData] = await connection.execute('SELECT id, first_name, last_name FROM employee');
    const employees = employeeData.map(({ id, first_name, last_name }) => ({ name: first_name + " " + last_name, value: id }));
    const empChoice = await inquirer.prompt([
      {
        type: 'list',
        name: 'name',
        message: "Which employee would you like to update?",
        choices: employees
      }
    ]);

    const [managerData] = await connection.execute('SELECT id, first_name, last_name FROM employee');
    const managers = managerData.map(({ id, first_name, last_name }) => ({ name: first_name + " " + last_name, value: id }));
    const managerChoice = await inquirer.prompt([
      {
        type: 'list',
        name: 'manager',
        message: "Who is the employee's manager?",
        choices: managers
      }
    ]);

    const params = [managerChoice.manager, empChoice.name];

    const [result] = await connection.execute(
      'UPDATE employee SET manager_id = ? WHERE id = ?',
      params
    );
    console.log("Employee has been updated!");
    showEmployees();
  } catch (err) {
    console.error(err);
  }
};

const employeeDepartment = async () => {
  try {
    console.log('Showing employee by departments...\n');
    const [rows] = await connection.execute(`
      SELECT employee.first_name, employee.last_name, department.name AS department
      FROM employee 
      LEFT JOIN role ON employee.role_id = role.id 
      LEFT JOIN department ON role.department_id = department.id
    `);
    console.table(rows);
    promptUser();
  } catch (err) {
    console.error(err);
  }
};


const deleteDepartment = async () => {
  try {
    const [deptData] = await connection.execute('SELECT id, name FROM department');
    const dept = deptData.map(({ name, id }) => ({ name: name, value: id }));
    const deptChoice = await inquirer.prompt([
      {
        type: 'list',
        name: 'dept',
        message: "What department do you want to delete?",
        choices: dept
      }
    ]);

    const [result] = await connection.execute('DELETE FROM department WHERE id = ?', [deptChoice.dept]);
    console.log("Successfully deleted!");
    showDepartments();
  } catch (err) {
    console.error(err);
  }
};


const deleteRole = async () => {
  try {
    const [roleData] = await connection.execute('SELECT id, title FROM role');
    const role = roleData.map(({ title, id }) => ({ name: title, value: id }));
    const roleChoice = await inquirer.prompt([
      {
        type: 'list',
        name: 'role',
        message: "What role do you want to delete?",
        choices: role
      }
    ]);

    const [result] = await connection.execute('DELETE FROM role WHERE id = ?', [roleChoice.role]);
    console.log("Successfully deleted!");
    showRoles();
  } catch (err) {
    console.error(err);
  }
};


const deleteEmployee = async () => {
  try {
    const [employeeData] = await connection.execute('SELECT id, first_name, last_name FROM employee');
    const employees = employeeData.map(({ id, first_name, last_name }) => ({ name: first_name + " " + last_name, value: id }));
    const empChoice = await inquirer.prompt([
      {
        type: 'list',
        name: 'name',
        message: "Which employee would you like to delete?",
        choices: employees
      }
    ]);

    const [result] = await connection.execute('DELETE FROM employee WHERE id = ?', [empChoice.name]);
    console.log("Successfully Deleted!");
    showEmployees();
  } catch (err) {
    console.error(err);
  }
};

const viewBudget = async () => {
  try {
    console.log('Showing budget by department...\n');
    const [rows] = await connection.execute(`
      SELECT department_id AS id, department.name AS department, SUM(salary) AS budget
      FROM role
      JOIN department ON role.department_id = department.id GROUP BY department_id
    `);
    console.table(rows);
    promptUser();
  } catch (err) {
    console.error(err);
  }
};

startApp();