CREATE DATABASE Bamazon_db;

USE Bamazon_db;

CREATE TABLE products(
	`item_id` INT NOT NULL AUTO_INCREMENT,
	`product_name` VARCHAR(120) NOT NULL,
	`department_name` VARCHAR (120) NOT NULL,
	`price` DECIMAL(10,2) NOT NULL,
	`stock_quantity` INT(100) NOT NULL,
	PRIMARY KEY(item_id)
);