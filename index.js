const path = require("path");
const fs = require('fs');
const ejs = require("ejs");
const Handlebars = require("handlebars");

const PREVIEW_SIZE = 256;
const TAB_SIZE =32;
const SIZES = [
    32, 64, 128, 256, 512, 1024, 2048
];

function cleanupId(id) {
    return encodeURIComponent(id.replace(/ /g, "").replace(/\./g, "_"));
}

async function doStuff() {
    let files = await fs.promises.readdir(path.join(__dirname, "brands"));
    let brandData = [];
    files.forEach(file => {
        console.log(file);
        let n = path.parse(file).name;
        let b = require(path.join(__dirname, "brands", file));
        b.id = cleanupId(n);
        if(!b.name) {
            b.name = n;
        }

        b.hasImages = b.images && b.images.length>0;
        b.hasColors = b.colors && b.colors.length>0;

        let needsTabImage =true;
        if(b.images) {
            for (let image of b.images) {
                image.id = cleanupId(image.file);
                if (!image.name) {
                    image.name = image.id;
                }
                image.hasSvg = false;
                image.sizes = [];
                for (let s of SIZES) {
                    if (fs.existsSync(path.join(__dirname, "img", b.name, image.file + "-x" + s + ".png"))) {
                        image.sizes.push(s);

                        if (needsTabImage && TAB_SIZE === s) {
                            needsTabImage = false;
                            b.tabImage = "img/" + b.name + "/" + image.file + "-x" + TAB_SIZE + ".png"
                        }
                    }
                }
                image.sizesStr = JSON.stringify(image.sizes);
                if (fs.existsSync(path.join(__dirname, "img", b.name, image.file + "-svg.svg"))) {
                    image.hasSvg = true;
                }

                if(!image.backgroundColor) {
                    if (!image.background || image.background === "light") {
                        image.backgroundColor = "#f5f5f5"
                        image.isLightBackground = image.background === "light";
                    } else if (image.background === "dark") {
                        image.backgroundColor = "#0a0a0a"
                        image.isDarkBackground = true;
                    }
                }
                if(!image.padding){
                    image.padding=0;
                }else{
                    image.hasPadding = true;
                }
            }
        }

        if(b.colors) {
            for (let color of b.colors) {
                if (color.color) {
                    color.isColor = true;
                }
                if (color.gradient) {
                    color.isGradient = true;
                }
                if (color.color && color.color.startsWith("#")) {
                    color.color = color.color.toUpperCase();
                }
            }
        }

        brandData.push(b);
    });

    let tpl = fs.readFileSync("index.handlebars", "utf8");
    let template = Handlebars.compile(tpl);
    let html = template({brands: brandData, previewSize: PREVIEW_SIZE});

    return fs.promises.writeFile(path.join(__dirname, "index.html"), html, "utf8");
}

doStuff();
