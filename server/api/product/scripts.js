// var lwip = require('lwip');
var Product = require('./product.model');
var config = require('./../../config/environment');
var fsExtra = require('fs.extra');
var fs = require('fs');


exports.script = function(req, res) {
	Product.find({
		featured: true
	}, function(err, products) {
		for (var i = 0; i < products.length; i++) {
			(function(i){
							var product = products[i];
			var imgPath = config.uploadPath + product.assetDir + "/" + product.primaryImg;
			var featureFilePath = config.uploadPath + "featured/" + product.primaryImg;
			if (fs.existsSync(featureFilePath)) {
				return;
			}
			var extPart = product.primaryImg.split('.')[1];
			console.log("---extension", extPart);
			fsExtra.copy(imgPath, featureFilePath, {
				replace: false
			}, function(err, result) {
				if (err) throw err;
				lwip.open(featureFilePath, function(err, image) {
					console.log("featurepath",featureFilePath);
					if(err|| !image) throw err|| new Error("image doesnt exist");
					image.resize(130, 100, function(err, rzdImage) {
						if (extPart.toLowerCase() === 'jpg' || extPart.toLowerCase() === 'jpeg') {
							rzdImage.toBuffer(extPart, {
								quality: 75
							}, function(err, buffer) {
								fs.writeFile(featureFilePath, buffer, function(err) {
									if (err) throw err;
	
								})
							})
						} else {
							if (extPart == 'png') {
								rzdImage.toBuffer(extPart, {
									compression: "high",
									interlaced: false,
									transparency: 'auto'
								}, function(err, buffer) {
									fs.writeFile(featureFilePath, buffer, function(err) {
										if (err) throw err;
								
									})
								})
							}
						}
					})

				})
			})
			}(i))
		}
	})
}