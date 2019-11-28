var mysql = require("mysql");

var inquirer = require("inquirer");

var connection = mysql.createConnection({
    host: "localhost",
  
    port: 3306,
  
    user: "root",
  
    password: "",
    database: "bamazon_db"
  });

connection.connect(function(err) {
    if (err) throw err;
    start();
    // displayStock();
    // userBuy();
});

function start() {
  inquirer
    .prompt({
      name: "selectOption",
      type: "list",
      message: "What do you like to do in Bamazon?",
      choices: ["VIEW PRODUCTS FOR SALE", "MADE A PURCHASE", "VIEW LOW INVENTORY", "ADD MORE ITEMS TO A PRODUCT", "ADD NEW PRODUCT"]
    })
    .then(function(answer) {
      if (answer.selectOption === "VIEW PRODUCTS FOR SALE") {
        displayStock();
      }
      else if(answer.selectOption === "MADE A PURCHASE") {
        userBuy();
      } 
      else if(answer.selectOption === "VIEW LOW INVENTORY") {
        lowInventory();
      }
      else if(answer.selectOption === "ADD MORE ITEMS TO A PRODUCT") {
        addToInventory();
      }
      else if(answer.selectOption === "ADD NEW PRODUCT") {
        addNewProduct();
      }
      else{
        connection.end();
      }
    });
}
  
function displayStock() {
    console.log("\nHere is our inventory: \n");
    console.log("item id\t  product\t   department\t  price\t  stock\n");
    connection.query("SELECT * FROM products", function(err, res) {
        if (err) throw err;
        for (i in res) {
            console.log("\n" + res[i].item_id + "\t" + res[i].product_name + "\t" + res[i].department_name +
             "\t" + res[i].price + "\t" + res[i].stock_quantity + "\n");
        }
      });
    start();
}

function userBuy() {
  connection.query("SELECT * FROM products", function(err, results) {
    if (err) throw err;
    inquirer
      .prompt([
        {
          name: "choice",
          type: "rawlist",
          choices: function() {
            var choiceArray = [];
            for (var i = 0; i < results.length; i++) {
              choiceArray.push(results[i].item_id);
            }
            return choiceArray;
          },
          message: "Choose the product ID do you want to buy?"
        },
        {
          name: "quantityPurchased",
          type: "input",
          message: "How many units do you want to buy of this product?"
        }
      ])
      .then(function(answer) {
        var chosenItem;
        for (var i = 0; i < results.length; i++) {
          if (results[i].item_id === answer.choice) {
            chosenItem = results[i];
          }
        }

        if (chosenItem.stock_quantity >= parseInt(answer.quantityPurchased)) {           
        
          
          var qPurchased = answer.quantityPurchased;
          var itemPrice = chosenItem.price;
          var stockQuantity = chosenItem.stock_quantity;
          var newStockQuantity = stockQuantity - qPurchased;
          var totalPayment = qPurchased * itemPrice;
          var query = connection.query (
            "UPDATE products SET ? WHERE ?",
            [
              {
                stock_quantity: newStockQuantity
              },
              {
                item_id: chosenItem.item_id
              }
            ],
            function(error) {
              if (error) throw err;
              console.log("\nYour purchased was successfully! you have to pay " + totalPayment + "\n");
              start();
            }
          );
        }

        else {
          console.log("We dont have enough stock to complete this sale ");
          start();
        }
        
      });
  });
}

function lowInventory() {
  connection.query("SELECT * FROM products", function(err, results) {
    if (err) throw err;
    console.log("\nWe have low inventory on the next products: \n");
    for (var i = 0; i < results.length; i++) {
      if (results[i].stock_quantity <= 5) {
        var itemIdLow = [];
        var productNameLow = [];
        var stockQuantityLow = [];
            itemIdLow.push(results[i].item_id);
            productNameLow.push(results[i].product_name);
            stockQuantityLow.push(results[i].stock_quantity);
            // console.log("\nThe next products have 5 or less units on inventory: \n");
            console.log("Item Id\tProduct Name\tStock Quantity");
            console.log(itemIdLow + "\t" + productNameLow + "\t" + stockQuantityLow + "\n");
      }
    }
    start();
  });
}

function addToInventory() {       //Aqui me quede
  inquirer
    .prompt([
      {
        name: "item_id",
        type: "input",
        message: "What is the id of the item you would like to add units?"
      },
      {
        name: "new_stock",
        type: "input",
        message: "Whats is the new stock quantity available for this product?",
        validate: function(value) {
          if (isNaN(value) === false) {
            return true;
          }
          return false;
        }
      }
    ])
    .then(function(answer) {
      connection.query(
        "UPDATE products SET ? WHERE ?",
        [
          {
            stock_quantity: answer.new_stock
          },
          {
            item_id: answer.item_id
          }
        ],
        function(err) {
          if (err) throw err;
          console.log("Your new stock was updated successfully!");
          start();
        }
      );
    });
}

function addNewProduct() {
  inquirer
    .prompt([
      {
        name: "productName",
        type: "input",
        message: "What is the product you would like to submit?"
      },
      {
        name: "department",
        type: "input",
        message: "What department would you like to place your product in?"
      },
      {
        name: "price",
        type: "input",
        message: "What is the price for this new product?",
        validate: function(value) {
          if (isNaN(value) === false) {
            return true;
          }
          return false;
        }
      },
      {
        name: "stock",
        type: "input",
        message: "What is the start quantity of stock for this new product?",
        validate: function(value) {
          if (isNaN(value) === false) {
            return true;
          }
          return false;
        }
      }
    ])
    .then(function(answer) {
      connection.query(
        "INSERT INTO products SET ?",
        {
          product_name: answer.productName,
          department_name: answer.department,
          price: answer.price,
          stock_quantity: answer.stock
        },
        function(err) {
          if (err) throw err;
          console.log("Your new product was created successfully!");
          start();
        }
      );
    });
}
