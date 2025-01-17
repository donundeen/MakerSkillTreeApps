const fs = require('fs');
const xml2js = require('xml2js');

let filePath = '../SkillTreeFiles/CNC and Cam Skill Tree/MakerSkillTree - cnc___cam.svg';


parseSVG(filePath);



function parseSVG(filePath) {
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
            console.log(result.svg.text);
            const textboxes = result.svg.text.filter(text => text.$.class.includes('textbox-inner'));
            console.log(textboxes);    

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
            let levelNumber = 0;

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

            console.log(levels);
        });
    });
}
