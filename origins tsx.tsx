import React, { useEffect, useRef } from 'react';

const AsciiApeFace: React.FC = () => {
    const canvasRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        let width = 80;
        let height = 50;
        let grid: string[][] = [];
        let time = 0;
        let animationFrameId: number;
        const textString = "originsoflate";
        let textPositions: Array<{x: number, y: number, life: number}> = [];
        
        // Initialize grid
        function initGrid() {
            grid = [];
            for (let y = 0; y < height; y++) {
                let row = [];
                for (let x = 0; x < width; x++) {
                    row.push(' ');
                }
                grid.push(row);
            }
        }
        
        // Render grid
        function render() {
            let html = '';
            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    html += grid[y][x];
                }
                html += '<br>';
            }
            canvas.innerHTML = html;
        }
        
        // Check if point is inside gorilla face shape - matching the photo with rounded edges
        function isInFace(x: number, y: number): { inFace: boolean, depth: number, isEdge: boolean } {
            const cx = width / 2;
            const cy = height / 2;
            const dx = x - cx;
            const dy = y - cy;
            
            // Large, wide head with prominent forehead
            const headWidth = 24;
            const headHeight = 22;
            const headDist = (dx * dx) / (headWidth * headWidth) + (dy * dy) / (headHeight * headHeight);
            
            // Very prominent forehead/brow ridge area
            if (dy < -8 && Math.abs(dx) < 20) {
                const foreheadDist = (dx * dx) / (20 * 20) + ((dy + 8) * (dy + 8)) / (8 * 8);
                if (foreheadDist < 1.2) {
                    const isEdge = foreheadDist > 0.85 && foreheadDist < 1.2;
                    return { inFace: true, depth: 1.5 - foreheadDist, isEdge };
                }
            }
            
            if (headDist < 1) {
                const isEdge = headDist > 0.75 && headDist < 1;
                return { inFace: true, depth: 1 - headDist, isEdge };
            }
            
            // Extended edge area with dots
            if (headDist >= 1 && headDist < 1.15) {
                return { inFace: false, depth: 0, isEdge: true };
            }
            
            return { inFace: false, depth: 0, isEdge: false };
        }
        
        // Deep-set, intense eyes
        function isInEyes(x: number, y: number): { inEyes: boolean, isPupil: boolean, isDeepSocket: boolean } {
            const cy = height / 2 - 3;
            const leftEyeX = width / 2 - 9;
            const rightEyeX = width / 2 + 9;
            const eyeRadius = 3;
            const pupilRadius = 1.8;
            const socketRadius = 5;
            
            const leftDist = Math.sqrt((x - leftEyeX) ** 2 + (y - cy) ** 2);
            const rightDist = Math.sqrt((x - rightEyeX) ** 2 + (y - cy) ** 2);
            
            // Deep eye sockets
            if (leftDist < socketRadius || rightDist < socketRadius) {
                if (leftDist < pupilRadius || rightDist < pupilRadius) {
                    return { inEyes: true, isPupil: true, isDeepSocket: false };
                }
                if (leftDist < eyeRadius || rightDist < eyeRadius) {
                    return { inEyes: true, isPupil: false, isDeepSocket: false };
                }
                return { inEyes: true, isPupil: false, isDeepSocket: true };
            }
            
            return { inEyes: false, isPupil: false, isDeepSocket: false };
        }
        
        // Heavy, prominent brow ridge
        function isInBrow(x: number, y: number): { inBrow: boolean, intensity: number } {
            const cy = height / 2 - 6;
            const browHeight = 3;
            const browWidth = 22;
            const cx = width / 2;
            
            const dy = Math.abs(y - cy);
            const dx = Math.abs(x - cx);
            
            if (dy < browHeight && dx < browWidth) {
                const intensity = 1 - (dy / browHeight) * (dx / browWidth);
                return { inBrow: true, intensity };
            }
            
            return { inBrow: false, intensity: 0 };
        }
        
        // Wide, flat nose with prominent nostrils
        function isInNose(x: number, y: number): { inNose: boolean, isNostril: boolean, isBridge: boolean } {
            const cx = width / 2;
            const cy = height / 2 + 4;
            const noseWidth = 8;
            const noseHeight = 6;
            
            // Wide nose bridge
            if (Math.abs(x - cx) < 3 && y > cy - 6 && y < cy) {
                return { inNose: true, isNostril: false, isBridge: true };
            }
            
            // Wide, flat nose tip area
            if (Math.abs(x - cx) < noseWidth && Math.abs(y - cy) < noseHeight) {
                // Large, prominent nostrils
                const leftNostrilX = cx - 4;
                const rightNostrilX = cx + 4;
                const nostrilY = cy + 1;
                const nostrilRadius = 2;
                
                const leftNostrilDist = Math.sqrt((x - leftNostrilX) ** 2 + (y - nostrilY) ** 2);
                const rightNostrilDist = Math.sqrt((x - rightNostrilX) ** 2 + (y - nostrilY) ** 2);
                
                if (leftNostrilDist < nostrilRadius || rightNostrilDist < nostrilRadius) {
                    return { inNose: true, isNostril: true, isBridge: false };
                }
                
                return { inNose: true, isNostril: false, isBridge: false };
            }
            
            return { inNose: false, isNostril: false, isBridge: false };
        }
        
        // Serious, straight mouth expression
        function isInMouth(x: number, y: number): { inMouth: boolean, isLip: boolean } {
            const cx = width / 2;
            const cy = height / 2 + 12;
            const mouthWidth = 11;
            const lipHeight = 2;
            
            const dx = x - cx;
            const dy = y - cy;
            
            // Straight, serious mouth line
            if (Math.abs(dx) < mouthWidth && Math.abs(dy) < lipHeight) {
                return { inMouth: true, isLip: Math.abs(dy) < 1 };
            }
            
            return { inMouth: false, isLip: false };
        }
        
        // Prominent lower jaw and cheeks
        function isInMuzzle(x: number, y: number): { inMuzzle: boolean, depth: number } {
            const cx = width / 2;
            const cy = height / 2 + 9;
            const muzzleWidth = 16;
            const muzzleHeight = 10;
            
            const dx = (x - cx) / muzzleWidth;
            const dy = (y - cy) / muzzleHeight;
            const dist = dx * dx + dy * dy;
            
            if (dist < 1) {
                return { inMuzzle: true, depth: 1 - dist };
            }
            
            return { inMuzzle: false, depth: 0 };
        }
        
        // Update grid
        function update() {
            initGrid();
            
            const t = time * 0.03;
            
            // Spawn text that scrolls across
            if (Math.random() < 0.02) {
                const ry = Math.floor(height / 2 - 15 + Math.random() * 30);
                const checkFace = isInFace(width / 2, ry);
                if (checkFace.inFace) {
                    textPositions.push({
                        x: -textString.length,
                        y: ry,
                        life: width + textString.length + 20
                    });
                }
            }
            
            // Update text positions - scroll right
            textPositions = textPositions.filter(pos => {
                pos.x += 0.5;
                pos.life--;
                return pos.life > 0 && pos.x < width;
            });
            
            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    const wave = Math.sin(x * 0.15 + y * 0.12 + t);
                    const noise = Math.sin(x * 0.3 + t * 0.7) * Math.cos(y * 0.25 + t * 0.5);
                    const faceInfo = isInFace(x, y);
                    
                    // Prominent brow ridge - very dark and heavy
                    const browInfo = isInBrow(x, y);
                    if (browInfo.inBrow) {
                        grid[y][x] = browInfo.intensity > 0.5 ? '8' : '1';
                    }
                    // Deep-set eyes
                    else {
                        const eyeInfo = isInEyes(x, y);
                        if (eyeInfo.inEyes) {
                            if (eyeInfo.isPupil) {
                                grid[y][x] = '8';
                            } else if (eyeInfo.isDeepSocket) {
                                grid[y][x] = '8';
                            } else {
                                grid[y][x] = '1';
                            }
                        }
                        // Wide, flat nose
                        else {
                            const noseInfo = isInNose(x, y);
                            if (noseInfo.inNose) {
                                if (noseInfo.isNostril) {
                                    grid[y][x] = '8';
                                } else if (noseInfo.isBridge) {
                                    grid[y][x] = '1';
                                } else {
                                    grid[y][x] = wave > 0 ? '1' : '8';
                                }
                            }
                            // Serious mouth
                            else {
                                const mouthInfo = isInMouth(x, y);
                                if (mouthInfo.inMouth) {
                                    grid[y][x] = mouthInfo.isLip ? '8' : '1';
                                }
                                // Strong jaw/muzzle
                                else {
                                    const muzzleInfo = isInMuzzle(x, y);
                                    if (muzzleInfo.inMuzzle) {
                                        const muzzlePattern = wave * 0.4 + noise * 0.6 + muzzleInfo.depth;
                                        if (muzzlePattern > 0.5) {
                                            grid[y][x] = '1';
                                        } else {
                                            grid[y][x] = '8';
                                        }
                                    }
                                    // Face texture with depth
                                    else if (faceInfo.inFace) {
                                        const combined = wave + noise + faceInfo.depth * 0.7;
                                        if (combined > 0.5) {
                                            grid[y][x] = '1';
                                        } else {
                                            grid[y][x] = '8';
                                        }
                                    }
                                    // Edge dots for rounded appearance
                                    else if (faceInfo.isEdge) {
                                        const dotPattern = Math.sin(x * 0.8 + y * 0.6 + t * 0.3);
                                        if (dotPattern > 0.3) {
                                            grid[y][x] = '.';
                                        }
                                    }
                                    // Minimal background
                                    else {
                                        const bgPattern = Math.sin(x * 0.1 + t * 0.3) * Math.cos(y * 0.08 + t * 0.2);
                                        if (bgPattern > 0.9) {
                                            grid[y][x] = '.';
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
            
            // Place scrolling text on grid
            textPositions.forEach(pos => {
                for (let i = 0; i < textString.length; i++) {
                    const tx = Math.floor(pos.x) + i;
                    if (tx >= 0 && tx < width && pos.y >= 0 && pos.y < height) {
                        grid[pos.y][tx] = textString[i];
                    }
                }
            });
            
            time++;
        }
        
        function animate() {
            update();
            render();
            animationFrameId = requestAnimationFrame(animate);
        }
        
        initGrid();
        animationFrameId = requestAnimationFrame(animate);

        return () => {
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
                animationFrameId = 0;
            }
            
            if (canvas) {
                canvas.innerHTML = '';
            }
            
            grid = [];
            time = 0;
            textPositions = [];
        };
    }, []);

    return (
        <div style={{ 
            margin: 0,
            background: '#0a0a0a',
            overflow: 'hidden',
            fontFamily: 'monospace',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh'
        }}>
            <div style={{
                padding: '20px',
                position: 'relative',
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                <div 
                    ref={canvasRef}
                    style={{
                        lineHeight: '0.9',
                        letterSpacing: '0.08em',
                        fontSize: '14px',
                        color: '#00ff88',
                        userSelect: 'none',
                        width: '100%',
                        height: '100%',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                    }}
                />
            </div>
        </div>
    );
};

export default AsciiApeFace;