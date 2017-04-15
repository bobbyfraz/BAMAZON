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
		message: "Choose a product to purchase.",
		choices: itemNames,
		name: "itemChoice"
	},
	{
		type: "input",
		message: "Enter the quantity you would like to purchase.",
		name: "quantity"
	}]).then(function(choices){
		var quantity = parseInt(choices.quantity);
		ProcessPurchase(choices, items);
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
				setTimeout(function(){
					pool.end(function(error){
						if (error)
							throw error;
					});
				}, 1000);
			}
			else {
				console.log("Unfortunately there is not enough stock to fill your order.");
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

DisplayItems();