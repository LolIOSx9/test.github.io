const BYTES_PER_LINE = 16;
let differences = [];
let lastPercentUpdate = 0;

async function readFile(file) {
    return new Uint8Array(await file.arrayBuffer());
}

function formatHex(byte) {
    return byte.toString(16).padStart(2, '0');
}

function removeFile(fileNumber) {
    const fileInput = document.getElementById(`file${fileNumber}`);
    fileInput.value = '';
    alert(`File ${fileNumber} has been removed.`);
}

function updateProgressBar(percent) {
    if (percent - lastPercentUpdate >= 5 || percent === 100) {
        const progressBar = document.querySelector('.progress-bar');
        const progressPercentage = document.querySelector('.progress-percentage');
        progressBar.style.width = `${percent}%`;
        progressPercentage.textContent = `${Math.round(percent)}%`;
        lastPercentUpdate = percent;
    }
}

async function compareFiles() {
    const file1Input = document.getElementById('file1');
    const file2Input = document.getElementById('file2');
    const comparisonTimeDisplay = document.getElementById('comparison-time');

    if (file1Input.files.length === 0 || file2Input.files.length === 0) {
        alert('Please select both files.');
        return;
    }

    alert('Comparing files in progress. Please wait.');

    const file1 = file1Input.files[0];
    const file2 = file2Input.files[0];

    const startTime = performance.now();
    updateProgressBar(0);

    try {
        const [bytes1, bytes2] = await Promise.all([readFile(file1), readFile(file2)]);
        differences = [];

        const maxLength = Math.max(bytes1.length, bytes2.length);
        for (let idx = 0; idx < maxLength; idx += BYTES_PER_LINE) {
            await new Promise(resolve => setTimeout(resolve, 0));

            const line1 = bytes1.slice(idx, idx + BYTES_PER_LINE);
            const line2 = bytes2.slice(idx, idx + BYTES_PER_LINE);

            let diff1 = '';
            let diff2 = '';
            let hasDifference = false;

            for (let i = 0; i < BYTES_PER_LINE; i++) {
                const b1 = line1[i] ?? 0;
                const b2 = line2[i] ?? 0;

                if (b1 !== b2) {
                    hasDifference = true;
                    diff1 += formatHex(b1) + ' ';
                    diff2 += formatHex(b2) + ' ';
                }
            }

            if (hasDifference) {
                differences.push({ offset: idx, line1: diff1.trim(), line2: diff2.trim() });
            }

            updateProgressBar(((idx + BYTES_PER_LINE) / maxLength) * 100);
        }

        updateProgressBar(100);

        const endTime = performance.now();
        const timeTaken = (endTime - startTime).toFixed(2);

        if (differences.length === 0) {
            alert('The files are identical.');
        } else {
            alert('Comparison complete. Differences found. You can now export them.');
            displayExportResults();
        }

        comparisonTimeDisplay.textContent = `Comparison completed in ${timeTaken} ms.`;
    } catch (error) {
        console.error('Error reading files:', error);
        alert('An error occurred during file comparison.');
    }
}

function displayExportResults() {
    const diffContent = differences.map(difference => {
        return `Offset ${difference.offset.toString(16).padStart(8, '0')}
  File 1: ${difference.line1}
  File 2: ${difference.line2}`;
    }).join('\n\n');

    const exportResultBox = document.getElementById('export-result-box');
    const exportResultElement = document.getElementById('export-result');
    exportResultElement.textContent = diffContent;
    exportResultBox.style.display = 'block';
}

function exportDifferences() {
    if (differences.length === 0) {
        alert('No differences to export.');
        return;
    }

    const diffContent = differences.map(difference => {
        return `Offset ${difference.offset.toString(16).padStart(8, '0')}
  File 1: ${difference.line1}
  File 2: ${difference.line2}`;
    }).join('\n\n');

    const blob = new Blob([diffContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = 'differences.txt';
    link.click();

    URL.revokeObjectURL(url);
}