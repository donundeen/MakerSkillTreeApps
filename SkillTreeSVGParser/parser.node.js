const fs = require('fs');
const xml2js = require('xml2js');
const path = require('path');


const baseDir = '/Users/donundeen/Documents/htdocs/MakerSkillTree';//'../SkillTreeFiles';

const outputDir = '/Users/donundeen/Documents/htdocs/MakerSkillTreeApps/SkillTreeSVGParser/JSONFiles';

// Function to parse SVG files
function parseSVG(filePath) {
    console.log(filePath);
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading SVG file:', err);
            return;
        }

        xml2js.parseString(data, (err, result) => {
            if (err) {
                console.error('Error parsing SVG file:', err);
                return;
            }

            const textElements = [];
            let textboxes;

            try {
                // Attempt to filter text elements with the class "textbox-inner"
                textboxes = result.svg.text.filter(text => text.$.class.includes('textbox-inner'));
            } catch (filterError) {
              //  console.error('Error filtering text elements:', filterError);
                console.log(`Skipping invalid SVG file: ${filePath}`);
                return; // Skip this SVG file
            }

            textboxes.forEach(textbox => {
                const textContent = textbox.tspan.map(tspan => tspan._).join(' ').replace(/\s+/g, ' ').trim();
                const x = textbox.$.x;
                const y = textbox.$.y;

                textElements.push({ text: textContent, x: x, y: y });
            });

            // Sort textElements by y values in descending order
            textElements.sort((a, b) => b.y - a.y); // Higher Y values first

            // Group textElements into levels
            const levels = [];
            let currentLevel = [];
            let levelNumber = 1;

            textElements.forEach((element, index) => {
                if (index === 0) {
                    element.level = levelNumber; // Assign level number to the first element
                    currentLevel.push(element); // Start the first level
                } else {
                    const previousElement = textElements[index - 1];
                    if (previousElement.y - element.y <= 3) {
                        element.level = levelNumber; // Assign the same level number
                        currentLevel.push(element); // Add to current level
                    } else {
                        levels.push(currentLevel); // Save the current level
                        levelNumber++; // Increment level number
                        element.level = levelNumber; // Assign level number to the new element
                        currentLevel = [element]; // Start a new level
                    }
                }
            });

            // Push the last level if it exists
            if (currentLevel.length > 0) {
                levels.push(currentLevel);
            }
            // Flatten the levels into a single array
            const flattenedTextElements = levels.flat(); // or use: const flattenedTextElements = [].concat(...levels);

            // Remove x and y properties from each textElement
            const finalTextElements = flattenedTextElements.map(({ x, y, ...rest }) => rest);



//            console.log(finalJSON);

            // Save the resulting JSON data to a file in the output directory
            const jsonFileName = path.basename(filePath).replace(/\.svg$/, '.json'); // Get the file name and replace .svg with .json
            const jsonFilePath = path.join(outputDir, jsonFileName); // Combine outputDir with the new file name

            let finalJSON = {
                "Title": path.basename(filePath).replace(/\.svg$/, ''),
                "Skills": finalTextElements
            };            

            fs.writeFile(jsonFilePath, JSON.stringify(finalJSON, null, 2), (err) => {
                if (err) {
                    console.error('Error writing JSON file:', err);
                } else {
                    console.log(`JSON data saved to ${jsonFilePath}`);
                }
            });
        });
    });
}

// Function to iterate through directories and find SVG files
function findAndParseSVGs(dir) {
    fs.readdir(dir, { withFileTypes: true }, (err, files) => {
        if (err) {
            console.error('Error reading directory:', err);
            return;
        }

        files.forEach(file => {
            const fullPath = path.join(dir, file.name);
            if (file.isDirectory()) {
                // Recursively search in subdirectories
                findAndParseSVGs(fullPath);
            } else if (file.isFile() && file.name.endsWith('.svg')) {
                // Parse the SVG file
                parseSVG(fullPath);
            }
        });
    });
}

// Start the search for SVG files
findAndParseSVGs(baseDir);
