const orderModel = require("../models/orders");
const userModel = require("../models/users");
const nodemailer = require('nodemailer');

class Order {
  async getAllOrders(req, res) {
    try {
      let Orders = await orderModel
        .find({})
        .populate("allProduct.id", "pName pImages pPrice")
        .populate("user", "name email")
        .sort({ _id: -1 });
      if (Orders) {
        return res.json({ Orders });
      }
    } catch (err) {
      console.log(err);
    }
  }

  async getOrderByUser(req, res) {
    let { uId } = req.body;
    if (!uId) {
      return res.json({ message: "All filled must be required" });
    } else {
      try {
        let Order = await orderModel
          .find({ user: uId })
          .populate("allProduct.id", "pName pImages pPrice")
          .populate("user", "name email")
          .sort({ _id: -1 });
        if (Order) {
          return res.json({ Order });
        }
      } catch (err) {
        console.log(err);
      }
    }
  }

  // async postCreateOrder(req, res) {
  //   let { allProduct, user, amount, transactionId, address, phone } = req.body;
  //   if (
  //     !allProduct ||
  //     !user ||
  //     !amount ||
  //     !transactionId ||
  //     !address ||
  //     !phone
  //   ) {
  //     return res.json({ message: "All filled must be required" });
  //   } else {
  //     try {
  //       let newOrder = new orderModel({
  //         allProduct,
  //         user,
  //         amount,
  //         transactionId,
  //         address,
  //         phone,
  //       });
  //       let save = await newOrder.save();
  //       if (save) {
  //         return res.json({ success: "Order created successfully" });
  //       }
  //     } catch (err) {
  //       return res.json({ error: error });
  //     }
  //   }
  // }

  async postCreateOrder(req, res) {
    let { allProduct, user, amount, transactionId, address, phone } = req.body;
    if (!allProduct || !user || !amount || !transactionId || !address || !phone) {
      return res.json({ message: "All fields are required" });
    } else {
      try {
        const Ouser = await userModel
          .findById(user)
          .select("name email phoneNumber userImage updatedAt createdAt");

          

          // console.log("USer : ",Ouser)
        let newOrder = new orderModel({
          allProduct,
          user,
          amount,
          transactionId,
          address,
          phone,
        });
        // console.log("newOrder  ",newOrder)
        // console.log("All Products : ",allProduct)
        let save = await newOrder.save();
        if (save) {


          // Send email notification
          const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
              user: 'mzaydk@gmail.com',
              pass: 'adyrdnaerffkfndj'
            }
          });


          const mailOptions = {
            from: 'mzaydk@gmail.com', // replace with your email
            to: Ouser.email, // replace with the user's email
            subject: 'Thank you for placing your order',
            // html:`<br>Dear ${Ouser.name},\n\nThank you for placing your order.\n\n Order details:\n${JSON.stringify(newOrder)}</br>`
            html: `
            <div style="font-family: Arial, sans-serif; color: #333; font-size: 16px;">
              <p>Dear ${Ouser.name},</p>
              <p>Thank you for placing your order with our store! Your order details are as follows:</p>
              <table style="border-collapse: collapse; margin: 20px 0;">
                <thead>
                  <tr>
                    <th style="border: 1px solid #ccc; padding: 8px;">Product Name</th>
                    <th style="border: 1px solid #ccc; padding: 8px;">Price</th>
                    <th style="border: 1px solid #ccc; padding: 8px;">Quantity</th>
                  </tr>
                </thead>
                <tbody>
                  ${newOrder.allProduct.map(product => `
                    <tr>
                      <td style="border: 1px solid #ccc; padding: 8px;">${product.name}</td>
                      <td style="border: 1px solid #ccc; padding: 8px;">${product.price}₹</td>
                      <td style="border: 1px solid #ccc; padding: 8px;">${product.quantitiy }</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
              <p>Total Amount: ${newOrder.amount}₹</p>
              <p>Transaction ID: ${newOrder.transactionId}</p>
              <p>Shipping Address: ${newOrder.address}</p>
              <p>Contact Phone Number: ${newOrder.phone}</p>
              <p>Thank you for Shopping from us, and please don't hesitate to reach out if you have any questions or concerns.</p>
              <p>Sincerely,</p>
              <p>Your Red Cart Team</p>
            </div>
            `
          };

          transporter.sendMail(mailOptions, (err, info) => {
            if (err) {
              console.log(err);
            } else {
              console.log('Email sent: ' + info.response);
            }
          });

          return res.json({ success: "Order created successfully" });
        }
      } catch (err) {
        return res.json({ error: err });
      }
    }
  }

  async postUpdateOrder(req, res) {
    let { oId, status } = req.body;
    if (!oId || !status) {
      return res.json({ message: "All filled must be required" });
    } else {
      let currentOrder = orderModel.findByIdAndUpdate(oId, {
        status: status,
        updatedAt: Date.now(),
      });
      currentOrder.exec((err, result) => {
        if (err) console.log(err);
        return res.json({ success: "Order updated successfully" });
      });
    }
  }

  async postDeleteOrder(req, res) {
    let { oId } = req.body;
    if (!oId) {
      return res.json({ error: "All filled must be required" });
    } else {
      try {
        let deleteOrder = await orderModel.findByIdAndDelete(oId);
        if (deleteOrder) {
          return res.json({ success: "Order deleted successfully" });
        }
      } catch (error) {
        console.log(error);
      }
    }
  }
}

const ordersController = new Order();
module.exports = ordersController;




// html: `
// <div style="font-family: Arial, sans-serif; color: #333; font-size: 16px;">
//   <p>Dear ${Ouser.name},</p>
//   <p>Thank you for placing your order with our store! Your order details are as follows:</p>
//   <0.table style="border-collapse: collapse; margin: 20px 0;">
//     <thead>
//       <tr>
//         <th style="border: 1px solid #ccc; padding: 8px;">Product Name</th>
//         <th style="border: 1px solid #ccc; padding: 8px;">Price</th>
//         <th style="border: 1px solid #ccc; padding: 8px;">Quantity</th>
//       </tr>
//     </thead>
//     <tbody>
//       ${newOrder.allProduct.map(product => `
//         <tr>
//           <td style="border: 1px solid #ccc; padding: 8px;">${product.id}</td>
//           <td style="border: 1px solid #ccc; padding: 8px;">${product.price}</td>
//           <td style="border: 1px solid #ccc; padding: 8px;">${product.quantitiy }</td>
//         </tr>
//       `).join('')}
//     </tbody>
//   </table>
//   <p>Total Amount: ${newOrder.amount}</p>
//   <p>Transaction ID: ${newOrder.transactionId}</p>
//   <p>Shipping Address: ${newOrder.address}</p>
//   <p>Contact Phone Number: ${newOrder.phone}</p>
//   <p>Thank you for Shopping from us, and please don't hesitate to reach out if you have any questions or concerns.</p>
//   <p>Sincerely,</p>
//   <p>Your Red Cart Team</p>
// </div>
// `


// html: `
// <div style="font-family: Arial, sans-serif; color: #333; font-size: 16px;">
//   <p>Dear ${Ouser.name},</p>
//   <p>Thank you for placing your order with our store! Your order details are as follows:</p>
  
//   <p>Total Amount: ${newOrder.amount}</p>
//   <p>Transaction ID: ${newOrder.transactionId}</p>
//   <p>Shipping Address: ${newOrder.address}</p>
//   <p>Contact Phone Number: ${newOrder.phone}</p>
//   <p>Thank you for Shopping from us, and please don't hesitate to reach out if you have any questions or concerns.</p>
//   <p>Sincerely,</p>
//   <p>Your Red Cart Team</p>
// </div>
// `