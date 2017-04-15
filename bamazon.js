const MySQL = require("mysql"), 
Inquirer = require("inquirer");

const pool = MySQL.createPool({
	connectionLimit: 5,
	host: "localhost",
	user: "root",
	password: "password",
	database: "bamazon_DB"
});

function DisplayItems(){
	pool.getConnection(function(error, connection){
		if (error)
			throw error;

		connection.query("SELECT item_id, product_name, price FROM products;", function(error, data, fields){
			if (error)
				throw error;
			console.log("------- Welcome -------");
			for (var index = 0; index < data.length; index++){
				console.log("id#:" + data[index].item_id + 
				"  " + data[index].product_name +
				" $" + data[index].price);
			}
			ChooseItem(data);
		});
		connection.release();
	});
};

function ChooseItem(items){
	var itemNames = [];
	for (var index = 0; index < items.length; index++)
		itemNames.push(items[index].product_name + " id#:" + items[index].item_id);

	Inquirer.prompt([{
		type: "list",
		message: "Choose the product you would like to purchase.",
		choices: itemNames,
		name: "itemChoice"
	},
	{
		type: "input",
		message: "Please enter the number of how many you would like to purchase.",
		name: "quantity"
	}]).then(function(choices){
		var quantity = parseInt(choices.quantity);
		if (isNaN(quantity)){
			console.log("Sorry, the quantity you entered was not a number. Please try again.");
			pool.end(function(error){
				if (error)
					throw error;
			});
		}
		else if (quantity < 1){
			console.log("Sorry, you can't buy 0 or a negative amount of items.");
			pool.end(function(error){
				if (error)
					throw error;
			});
		}
		else{
			ProcessPurchase(choices, items);
		}
	});
};

function ProcessPurchase(userChoices, allItemInfo){
	var itemID = userChoices.itemChoice.split(':')[1];
	pool.getConnection(function(error, connection){
		if (error)
			throw error;
		connection.query("SELECT * FROM products WHERE item_id = ?", [itemID],function(error, data, fields){
			if (error)
				throw error;
			var quantity = parseInt(userChoices.quantity);

			if (data[0].stock_quantity >= quantity){
				var stockRemaining = data[0].stock_quantity - quantity;
				UpdateDatabaseQuantity(itemID, stockRemaining); 
				var thisSale = data[0].price * quantity;
				console.log("Thank you! Your total is: $" + thisSale);

				UpdateDepartmentRevenue(thisSale, data[0].department_name, data[0].product_sales);
				setTimeout(function(){
					pool.end(function(error){
						if (error)
							throw error;
					});
				}, 1000);
			}
			else {
				console.log("Sorry, we don't have enough in stock to fulfill your order. Please check back soon.");
				pool.end(function(error){
					if (error)
						throw error;
				});
			}
		});
		connection.release();
	});
};

function UpdateDatabaseQuantity(itemID, quantityRemaining){
	pool.getConnection(function(error, connection){
		if (error)
			throw error;
		connection.query("UPDATE products SET stock_quantity = ? WHERE item_id = ?", [quantityRemaining, itemID], function(error, data, fields){
			if (error)
				throw error;
		});
		connection.release();
	});
};

function UpdateDepartmentRevenue(thisSale, departmentName, productSales){
	pool.getConnection(function(error, connection){
		if (error)
			throw error;
		var newTotalSales = productSales + thisSale;
		connection.query("UPDATE products SET product_sales = ? WHERE department_name = ?", 
		[newTotalSales, departmentName], function(error, data, fields){
			if (error)
				throw error;
		});
		connection.query("UPDATE departments SET total_sales = ? WHERE department_name = ?", 
		[newTotalSales, departmentName], function(error, data, fields){
			if (error)
				throw error;
		});
		connection.release();
	});
};

DisplayItems();