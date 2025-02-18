-- Add sample departments
INSERT INTO department (name) VALUES ('Engineering'), ('Sales'), ('HR');

-- Add sample roles
INSERT INTO role (title, salary, department_id) VALUES 
('Software Engineer', 70000, 1), 
('Sales Manager', 60000, 2), 
('HR Specialist', 55000, 3);

-- Add sample employees
INSERT INTO employee (first_name, last_name, role_id, manager_id) VALUES 
('John', 'Doe', 1, NULL), 
('Jane', 'Smith', 2, NULL), 
('Alice', 'Johnson', 3, 1);
