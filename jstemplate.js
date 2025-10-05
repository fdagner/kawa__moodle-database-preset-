const colorPalettes = {
    default: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#FFD93D', '#6BCF7F', '#C77DFF', '#FF9CEE'],
    cool: ['#A8E6CF', '#88C0D0', '#5E81AC', '#81A1C1', '#8FBCBB', '#4C566A', '#3B4252', '#2E3440', '#D8DEE9'],
    warm: ['#FF4500', '#FF6347', '#FF8C00', '#FFD700', '#FF1493', '#FF69B4', '#DC143C', '#FF7F50', '#FFB347'],
    pastel: ['#FFFACD', '#E6E6FA', '#FFD1DC', '#B5EAD7', '#C7CEEA', '#FDFD96', '#FFDAC1', '#AEC6CF', '#D5A6BD'],
    dark: ['#1A3C34', '#2E2A5B', '#4B1E3A', '#3B4A6B', '#5C4033', '#2F4F4F', '#8B1E3F', '#4A7043', '#3C2F2F'],
    monochrome: ['#888'],
    vera: ['#FF0000', '#00AA00', '#0000FF', '#FFD700', '#FF7F00', '#9400D3', '#00CED1', '#FF1493', '#32CD32'],
    nature: ['#556B2F', '#8F9779', '#A0522D', '#CD853F', '#D2B48C', '#6B4226', '#2E8B57', '#BDB76B', '#8B4513'],
    retro: ['#E97451', '#FFB347', '#4682B4', '#CBA135', '#8E793E', '#6B4226', '#FFD580', '#556B2F', '#B87333'],
    neon: ['#FF00FF', '#00FFFF', '#39FF14', '#FF3131', '#FFD700', '#FF6EC7', '#7DF9FF', '#FF6700', '#B026FF']
};


 function loadConfigFromString(jsonString) {
            try {
                const config = JSON.parse(jsonString);
                currentWord = config.currentWord || '';
                associations = config.associations || {};
                letterColors = config.letterColors || {};
                currentTemplate = config.currentTemplate || 'horizontal';
                currentColorPalette = config.currentColorPalette || 'default';

                mainWordInput.value = currentWord;
                document.querySelectorAll('.template-btn').forEach(btn => btn.classList.remove('active'));
                document.querySelector(`.template-btn[data-template="${currentTemplate}"]`)?.classList.add('active');
                document.querySelectorAll('.palette-btn').forEach(btn => btn.classList.remove('active'));
                document.querySelector(`.palette-btn[data-palette="${currentColorPalette}"]`)?.classList.add('active');

                updatePreview();
            } catch (e) {
                console.error('Fehler beim Laden der Konfiguration:', e);
                alert('Fehler beim Laden der Konfiguration: Ungültiges JSON.');
            }
        }

   function wrapText(text, maxWidth, fontSize = 16) {
            const words = text.split(' ');
            const lines = [];
            let currentLine = '';
            const avgCharWidth = fontSize * 0.6;

            for (let word of words) {
                const wordWidth = word.length * avgCharWidth;
                const testLine = currentLine ? currentLine + ' ' + word : word;
                const testLineWidth = testLine.length * avgCharWidth;

                if (testLineWidth > maxWidth && currentLine) {
                    lines.push(currentLine);
                    currentLine = word;
                } else {
                    currentLine = testLine;
                }
            }

            if (currentLine) {
                lines.push(currentLine);
            }

            return lines;
        }


     
        function generateSVG(forExport) {
            const fullString = currentWord;
            const minSpacing = 120;
            const minPadding = 150;
            const boxWidth = 45;

            let svgWidth, svgHeight, centerX, centerY;
            let spacing = minSpacing;

            const words = fullString.split(' ').filter(w => w.length > 0);
            const hasMultipleWords = words.length > 1;

            let maxBubbleRy = 35;
            if (currentTemplate === 'vertical') {
                let visibleIndex = 0;
                for (let i = 0; i < fullString.length; i++) {
                    if (fullString[i] === ' ') continue;
                    const assoc = associations[visibleIndex] || '';
                    if (assoc) {
                        const maxBubbleWidth = 211;
                        let bubbleWidth = Math.max(150, assoc.length * 10);
                        bubbleWidth = Math.min(bubbleWidth, maxBubbleWidth);
                        const lines = wrapText(assoc, bubbleWidth, 16);
                        const numLines = lines.length;
                        const lineHeight = 20;
                        const textHeight = numLines * lineHeight;
                        const padding = 25;
                        const bubbleRy = Math.max(35, (textHeight / 2) + padding);
                        maxBubbleRy = Math.max(maxBubbleRy, bubbleRy);
                    }
                    visibleIndex++;
                }
                spacing = Math.max(minSpacing, maxBubbleRy * 2);
            }

            const rowSpacing = 400;
            const rowSpacingV = 700;

            if (currentTemplate === 'horizontal') {
                const maxWordLength = Math.max(...words.map(w => w.length));
                const totalCenterSpan = maxWordLength > 0 ? (maxWordLength - 1) * spacing : 0;
                const minWidth = totalCenterSpan + boxWidth + 2 * minPadding;
                svgWidth = Math.max(600, minWidth);
                const neededHeight = words.length * rowSpacing + 2 * minPadding;
                svgHeight = Math.max(400, neededHeight);
                centerX = svgWidth / 2;
                centerY = svgHeight / 2;
            } else if (currentTemplate === 'vertical') {
                const maxWordLength = Math.max(...words.map(w => w.length));
                const totalCenterSpan = maxWordLength > 0 ? (maxWordLength - 1) * spacing : 0;
                const minHeight = totalCenterSpan + boxWidth + 2 * minPadding;
                svgHeight = Math.max(800, minHeight);
                const minWidth = hasMultipleWords ? (words.length * rowSpacingV + 2 * minPadding) : 1000;
                svgWidth = Math.max(1000, minWidth);
                centerX = svgWidth / 2;
                centerY = svgHeight / 2;
            }

            let svgW = forExport ? svgWidth : '100%';
            let svgH = forExport ? svgHeight : '100%';
            let viewBox = forExport ? '' : `viewBox="0 0 ${svgWidth} ${svgHeight}"`;
            let svgStyle = forExport ? 'background: transparent;' : 'background: transparent; width: 100%; height: auto;';

            let svg = `<svg width="${svgW}" height="${svgH}" ${viewBox} xmlns="http://www.w3.org/2000/svg" style="${svgStyle}">`;

            svg += `<defs><polygon points="0 0, 10 3, 0 6" fill="#333" /></defs>`;

            const positions = getLayoutPositions(fullString, words, currentTemplate, centerX, centerY, spacing, rowSpacing, rowSpacingV);

            let visibleIndex = 0;
            for (let i = 0; i < fullString.length; i++) {
                if (fullString[i] === ' ') {
                    continue;
                }
                const pos = positions[i];
                const assoc = associations[visibleIndex] || '';

                if (assoc) {
                    const color = letterColors[visibleIndex];
                    const arrowLength = 150 + Math.random() * 40;
                    let bubbleX = pos.x + pos.arrowDx * arrowLength;
                    let bubbleY = pos.y + pos.arrowDy * arrowLength;

                    const maxBubbleWidth = 211;
                    let bubbleWidth = Math.max(150, assoc.length * 10);
                    bubbleWidth = Math.min(bubbleWidth, maxBubbleWidth);
                    const lines = wrapText(assoc, bubbleWidth, 16);
                    const numLines = lines.length;
                    const lineHeight = 20;
                    const textHeight = numLines * lineHeight;
                    const padding = 25;
                    let bubbleRy = Math.max(35, (textHeight / 2) + padding);

                    const mag = Math.sqrt(pos.arrowDx * pos.arrowDx + pos.arrowDy * pos.arrowDy);
                    let targetX = bubbleX;
                    let targetY = bubbleY;
                    if (mag > 0) {
                        const unitDx = pos.arrowDx / mag;
                        const unitDy = pos.arrowDy / mag;
                        const rx = bubbleWidth / 2;
                        const ry = bubbleRy;
                        const denom = Math.sqrt((rx * unitDy) * (rx * unitDy) + (ry * unitDx) * (ry * unitDx));
                        const radius = (rx * ry) / denom;
                        targetX = bubbleX - unitDx * radius;
                        targetY = bubbleY - unitDy * radius;
                    }

                    const dx = targetX - pos.x;
                    const dy = targetY - pos.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    const frac = 0.4;
                    let controlX = pos.x + dx * frac;
                    let controlY = pos.y + dy * frac;
                    if (dist > 0) {
                        const unitPx = -dy / dist;
                        const unitPy = dx / dist;
                        const perpOffset = (Math.random() - 0.5) * 60;
                        controlX += unitPx * perpOffset;
                        controlY += unitPy * perpOffset;
                    }

                    svg += `<path d="M ${pos.x} ${pos.y} Q ${controlX} ${controlY} ${targetX} ${targetY}" 
                            stroke="${color}" stroke-width="3" fill="none" 
                            opacity="0.6"/>`;

                    svg += `
                        <ellipse cx="${bubbleX}" cy="${bubbleY}" rx="${bubbleWidth / 2}" ry="${bubbleRy}" 
                                 fill="${color}" opacity="0.3" 
                                 stroke="${color}" stroke-width="2"/>`;

                    const startTextY = bubbleY - (textHeight / 2) + (lineHeight / 2);
                    svg += `
                        <text x="${bubbleX}" y="${startTextY}" 
                              text-anchor="middle" 
                              font-family="sans-serif, cursive" 
                              font-size="16" 
                              fill="#333">`;
                    lines.forEach((line, idx) => {
                        const lineY = startTextY + idx * lineHeight;
                        if (idx === 0 && line.length > 0) {
                            const firstChar = escapeXml(line.charAt(0));
                            const rest = escapeXml(line.slice(1));
                            svg += `
                                <tspan x="${bubbleX}" y="${lineY}">
                                    <tspan font-weight="bold">${firstChar}</tspan>${rest}
                                </tspan>`;
                        } else {
                            svg += `<tspan x="${bubbleX}" y="${lineY}">${escapeXml(line)}</tspan>`;
                        }
                    });
                    svg += `</text>`;
                }
                visibleIndex++;
            }

            visibleIndex = 0;
            for (let i = 0; i < fullString.length; i++) {
                if (fullString[i] === ' ') continue;
                const letter = fullString[i];
                const pos = positions[i];
                const color = letterColors[visibleIndex];
                const rotation = (Math.random() - 0.5) * 15;

                svg += `
                    <g transform="translate(${pos.x}, ${pos.y}) rotate(${rotation})" class="letter-box-svg" onclick="openModal(${visibleIndex}, '${letter}')">
                        <rect x="-22" y="-30" width="44" height="50" 
                              rx="8" fill="${color}" 
                              stroke="#333" stroke-width="3"/>
                        <text x="0" y="5" 
                              text-anchor="middle" 
                              font-family="sans-serif, cursive" 
                              font-size="40" 
                              font-weight="bold" 
                              fill="white"
                              stroke="#333"
                              stroke-width="1" 
                              aria-label="Buchstabe ${letter} auswählen">${letter}</text>
                    </g>
                `;
                visibleIndex++;
            }

            svg += '</svg>';
            return svg;
        }

        function getLayoutPositions(fullString, words, template, centerX, centerY, spacing, rowSpacing, rowSpacingV) {
            const positions = [];
            let charIndex = 0;

            switch (template) {
                case 'horizontal':
                    const baseY = words.length > 1 ? centerY - ((words.length - 1) * rowSpacing / 2) : centerY;

                    for (let wordIdx = 0; wordIdx < words.length; wordIdx++) {
                        const word = words[wordIdx];
                        const wordLength = word.length;
                        const totalWordSpan = wordLength > 0 ? (wordLength - 1) * spacing : 0;
                        const wordStartX = centerX - (totalWordSpan / 2);

                        for (let i = 0; i < word.length; i++) {
                            const x = wordStartX + i * spacing;
                            const y = baseY + wordIdx * rowSpacing + (Math.random() - 0.5) * 60;
                            const side = i % 2 === 0 ? -1 : 1;
                            positions[charIndex] = {
                                x: x,
                                y: y,
                                arrowDx: (Math.random() - 0.5) * 0.5,
                                arrowDy: side
                            };
                            charIndex++;
                        }
                        charIndex++;
                    }
                    break;
                case 'vertical':
                    const maxWordLengthV = Math.max(...words.map(w => w.length));
                    const totalSpanV = maxWordLengthV > 0 ? (maxWordLengthV - 1) * spacing : 0;
                    const baseStartY = centerY - (totalSpanV / 2);
                    const baseX = words.length > 1 ? centerX - ((words.length - 1) * rowSpacingV / 2) : centerX;

                    for (let wordIdx = 0; wordIdx < words.length; wordIdx++) {
                        const word = words[wordIdx];
                        const wordStartY = baseStartY;
                        const wordX = baseX + wordIdx * rowSpacingV;

                        for (let i = 0; i < word.length; i++) {
                            const y = wordStartY + i * spacing;
                            const x = wordX + (Math.random() - 0.5) * 100;
                            const side = i % 2 === 0 ? -1 : 1;
                            positions[charIndex] = {
                                x: x,
                                y: y,
                                arrowDx: side,
                                arrowDy: (Math.random() - 0.5) * 0.5
                            };
                            charIndex++;
                        }
                        charIndex++;
                    }
                    break;
            }

            return positions;
        }

    function exportSVG() {
            if (!currentWord.trim()) {
                alert('Bitte gib erst ein Wort ein!');
                return;
            }

            const svg = generateSVG(true);
            const blob = new Blob([svg], { type: 'image/svg+xml' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `kawa-${currentWord.toLowerCase().replace(/\s/g, '-')}-${currentTemplate}.svg`;
            a.click();
            URL.revokeObjectURL(url);
        }

        function escapeXml(text) {
            return text
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&apos;');
        }

