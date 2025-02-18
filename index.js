const inquirer = require('inquirer');
const { Client } = require('pg');
require('dotenv').config();

// Create a new client to connect to PostgreSQL
const client = new Client({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
});

client.connect();

// Function to display the main menu
const mainMenu = async () => {
  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'What would you like to do?',
      choices: [
        'View all departments',
        'View all roles',
        'View all employees',
        'View employees by manager',
        'View employees by department',
        'View total department budget',
        'Add a department',
        'Add a role',
        'Add an employee',
        'Update employee role',
        'Update employee manager',
        'Exit',
      ],
    },
  ]);

  switch (action) {
    case 'View all departments':
      await viewDepartments();
      break;
    case 'View all roles':
      await viewRoles();
      break;
    case 'View all employees':
      await viewEmployees();
      break;
    case 'View employees by manager':
      await viewEmployeesByManager();
      break;
    case 'View employees by department':
      await viewEmployeesByDepartment();
      break;
    case 'View total department budget':
      await viewTotalBudget();
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
    case 'Update employee role':
      await updateEmployeeRole();
      break;
    case 'Update employee manager':
      await updateEmployeeManager();
      break;
    case 'Exit':
      client.end();
      break;
  }
};

// Function to view all departments
const viewDepartments = async () => {
  const res = await client.query('SELECT * FROM department');
  console.table(res.rows);
  mainMenu();
};

// Function to view all roles
const viewRoles = async () => {
  const res = await client.query(
    'SELECT role.id, role.title, role.salary, department.name AS department FROM role JOIN department ON role.department_id = department.id'
  );
  console.table(res.rows);
  mainMenu();
};

// Function to view all employees
const viewEmployees = async () => {
  const res = await client.query(
    `SELECT employee.id, employee.first_name, employee.last_name, role.title, department.name AS department, role.salary, manager.first_name AS manager
    FROM employee 
    JOIN role ON employee.role_id = role.id
    JOIN department ON role.department_id = department.id
    LEFT JOIN employee AS manager ON employee.manager_id = manager.id`
  );
  console.table(res.rows);
  mainMenu();
};

// Function to add a department
const addDepartment = async () => {
  const { name } = await inquirer.prompt({
    type: 'input',
    name: 'name',
    message: 'Enter the name of the new department:',
  });

  await client.query('INSERT INTO department (name) VALUES ($1)', [name]);
  console.log(`Added ${name} department!`);
  mainMenu();
};

// Function to add a role
const addRole = async () => {
  const departments = await client.query('SELECT * FROM department');
  const departmentChoices = departments.rows.map((dept) => ({
    name: dept.name,
    value: dept.id,
  }));

  const { title, salary, department_id } = await inquirer.prompt([
    {
      type: 'input',
      name: 'title',
      message: 'Enter the title of the new role:',
    },
    {
      type: 'input',
      name: 'salary',
      message: 'Enter the salary of the new role:',
    },
    {
      type: 'list',
      name: 'department_id',
      message: 'Select the department for the new role:',
      choices: departmentChoices,
    },
  ]);

  await client.query(
    'INSERT INTO role (title, salary, department_id) VALUES ($1, $2, $3)',
    [title, salary, department_id]
  );
  console.log(`Added ${title} role!`);
  mainMenu();
};

// Function to add an employee
const addEmployee = async () => {
  const roles = await client.query('SELECT * FROM role');
  const roleChoices = roles.rows.map((role) => ({
    name: role.title,
    value: role.id,
  }));

  const managers = await client.query('SELECT * FROM employee');
  const managerChoices = managers.rows.map((manager) => ({
    name: `${manager.first_name} ${manager.last_name}`,
    value: manager.id,
  }));

  managerChoices.push({ name: 'None', value: null });

  const { first_name, last_name, role_id, manager_id } = await inquirer.prompt([
    {
      type: 'input',
      name: 'first_name',
      message: 'Enter the first name of the new employee:',
    },
    {
      type: 'input',
      name: 'last_name',
      message: 'Enter the last name of the new employee:',
    },
    {
      type: 'list',
      name: 'role_id',
      message: 'Select the role of the new employee:',
      choices: roleChoices,
    },
    {
      type: 'list',
      name: 'manager_id',
      message: 'Select the manager of the new employee:',
      choices: managerChoices,
    },
  ]);

  await client.query(
    'INSERT INTO employee (first_name, last_name, role_id, manager_id) VALUES ($1, $2, $3, $4)',
    [first_name, last_name, role_id, manager_id]
  );
  console.log(`Added ${first_name} ${last_name} as an employee!`);
  mainMenu();
};

// Function to update employee role
const updateEmployeeRole = async () => {
  const employees = await client.query('SELECT * FROM employee');
  const employeeChoices = employees.rows.map((emp) => ({
    name: `${emp.first_name} ${emp.last_name}`,
    value: emp.id,
  }));

  const roles = await client.query('SELECT * FROM role');
  const roleChoices = roles.rows.map((role) => ({
    name: role.title,
    value: role.id,
  }));

  const { employee_id, role_id } = await inquirer.prompt([
    {
      type: 'list',
      name: 'employee_id',
      message: 'Select the employee to update:',
      choices: employeeChoices,
    },
    {
      type: 'list',
      name: 'role_id',
      message: 'Select the new role for the employee:',
      choices: roleChoices,
    },
  ]);

  await client.query('UPDATE employee SET role_id = $1 WHERE id = $2', [
    role_id,
    employee_id,
  ]);
  console.log('Employee role updated!');
  mainMenu();
};

// Function to update employee manager
const updateEmployeeManager = async () => {
  const employees = await client.query('SELECT * FROM employee');
  const employeeChoices = employees.rows.map((emp) => ({
    name: `${emp.first_name} ${emp.last_name}`,
    value: emp.id,
  }));

  const managers = await client.query('SELECT * FROM employee');
  const managerChoices = managers.rows.map((manager) => ({
    name: `${manager.first_name} ${manager.last_name}`,
    value: manager.id,
  }));

  managerChoices.push({ name: 'None', value: null });

  const { employee_id, manager_id } = await inquirer.prompt([
    {
      type: 'list',
      name: 'employee_id',
      message: 'Select the employee to update manager:',
      choices: employeeChoices,
    },
    {
      type: 'list',
      name: 'manager_id',
      message: 'Select the new manager for the employee:',
      choices: managerChoices,
    },
  ]);

  await client.query('UPDATE employee SET manager_id = $1 WHERE id = $2', [
    manager_id,
    employee_id,
  ]);
  console.log('Employee manager updated!');
  mainMenu();
};

// Function to view employees by manager
const viewEmployeesByManager = async () => {
  const managers = await client.query('SELECT * FROM employee');
  const managerChoices = managers.rows.map((manager) => ({
    name: `${manager.first_name} ${manager.last_name}`,
    value: manager.id,
  }));

  const { manager_id } = await inquirer.prompt([
    {
      type: 'list',
      name: 'manager_id',
      message: 'Select the manager to view their employees:',
      choices: managerChoices,
    },
  ]);

  const res = await client.query(
    `SELECT employee.id, employee.first_name, employee.last_name, role.title, department.name AS department
    FROM employee
    JOIN role ON employee.role_id = role.id
    JOIN department ON role.department_id = department.id
    WHERE employee.manager_id = $1`,
    [manager_id]
  );
  console.table(res.rows);
  mainMenu();
};

// Function to view employees by department
const viewEmployeesByDepartment = async () => {
  const departments = await client.query('SELECT * FROM department');
  const departmentChoices = departments.rows.map((dept) => ({
    name: dept.name,
    value: dept.id,
  }));

  const { department_id } = await inquirer.prompt([
    {
      type: 'list',
      name: 'department_id',
      message: 'Select the department to view employees:',
      choices: departmentChoices,
    },
  ]);

  const res = await client.query(
    `SELECT employee.id, employee.first_name, employee.last_name, role.title, department.name AS department
    FROM employee
    JOIN role ON employee.role_id = role.id
    JOIN department ON role.department_id = department.id
    WHERE department.id = $1`,
    [department_id]
  );
  console.table(res.rows);
  mainMenu();
};

// Function to view total utilized budget of a department
const viewTotalBudget = async () => {
  const departments = await client.query('SELECT * FROM department');
  const departmentChoices = departments.rows.map((dept) => ({
    name: dept.name,
    value: dept.id,
  }));

  const { department_id } = await inquirer.prompt([
    {
      type: 'list',
      name: 'department_id',
      message: 'Select the department to view the total budget:',
      choices: departmentChoices,
    },
  ]);

  const res = await client.query(
    `SELECT SUM(role.salary) AS total_budget
    FROM employee
    JOIN role ON employee.role_id = role.id
    WHERE role.department_id = $1`,
    [department_id]
  );
  console.log(`Total budget for the department: $${res.rows[0].total_budget}`);
  mainMenu();
};

// Initialize the application
mainMenu();
