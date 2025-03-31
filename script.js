let originalImage;
const imageInput = document.getElementById('imageInput');
const imageDimensionsSlider = document.getElementById('imageDimensions');
const frameRatioNumerator = document.getElementById('frameRatioNumerator');
const frameRatioDenominator = document.getElementById('frameRatioDenominator');
const frameRatiosSelect = document.getElementById('frameRatios');
const resultImage = document.getElementById('resultImage');
const dimensionValue = document.getElementById('dimensionValue');
const imageSizeDisplay = document.getElementById('imageSize');
const compressionSizeInput = document.getElementById('compressionSize'); // Added for user input
const detailsBody = document.getElementById('detailsBody');
let compressionDetails = [];

function uploadImage() {
  const file = imageInput.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function (event) {
      originalImage = new Image();
      originalImage.src = event.target.result;
      originalImage.onload = function () {
        updateDimensions();
      };
    };
    reader.readAsDataURL(file);
  }
}

function updateDimensions() {
  const numerator = parseFloat(frameRatioNumerator.value) || 1;
  const denominator = parseFloat(frameRatioDenominator.value) || 1;
  const selectedRatio = numerator / denominator;

  const scaleFactor = imageDimensionsSlider.value / 100;
  dimensionValue.textContent = imageDimensionsSlider.value + '%';

  const width = originalImage.width * scaleFactor;
  const height = width / selectedRatio;

  resultImage.width = width;
  resultImage.height = height;
  resultImage.src = resizeImage(width, height);

  // Update image size display
  const imageSizeInBytes = getImageSizeInBytes(resultImage.src);
  imageSizeDisplay.textContent = `${formatBytes(imageSizeInBytes)}`;
}

function resizeImage(newWidth, newHeight) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = newWidth;
  canvas.height = newHeight;
  ctx.drawImage(originalImage, 0, 0, newWidth, newHeight);

  // Adjust quality based on user-provided compression size
  let quality = 0.5; // Default quality
  const userCompressionSize = parseFloat(compressionSizeInput.value) || null;

  if (userCompressionSize) {
    const currentSize = getImageSizeInBytes(canvas.toDataURL('image/jpeg', quality));
    const targetSize = userCompressionSize * 1024; // Convert KB to bytes

    // Binary search for optimal quality to achieve the target size
    let lower = 0;
    let upper = 1;
    while (lower <= upper) {
      const mid = (lower + upper) / 2;
      const midSize = getImageSizeInBytes(canvas.toDataURL('image/jpeg', mid));
      if (midSize > targetSize) {
        upper = mid - 0.001;
      } else {
        lower = mid + 0.001;
        quality = mid;
      }
    }
  }

  return canvas.toDataURL('image/jpeg', quality);
}

function applyCompressionSize() {
  updateDimensions(); // Apply the compression size on demand
}

function downloadResultImage() {
  let imageName = document.getElementById('imageName').value || 'result_image'; // Default name if not provided
  const imageFormat = document.getElementById('imageFormat').value;

  // Validate and sanitize image name
  imageName = imageName.trim(); // Remove leading and trailing whitespaces

  if (imageName === '') {
    alert('Please provide a valid image name.');
    return;
  }

  // Cut the image name if it exceeds a certain length
  const maxLength = 20; // Change this value to set the maximum length
  if (imageName.length > maxLength) {
    imageName = imageName.substring(0, maxLength); // Truncate the name
  }

  const link = document.createElement('a');
  link.href = resultImage.src;
  link.download = `${imageName}.${imageFormat}`;
  link.click();

  // After compressing the image, update the compression details
  updateCompressionDetails('JPEG', getImageSizeInBytes(originalImage.src), getImageSizeInBytes(resultImage.src), 2); // Sample compression time
}

function getImageSizeInBytes(dataURL) {
  const base64String = atob(dataURL.split(',')[1]);
  return base64String.length;
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function selectFrameRatio() {
  const selectedRatio = parseFloat(frameRatiosSelect.value);
  frameRatioNumerator.value = selectedRatio;
  frameRatioDenominator.value = 1;
  updateDimensions();
}

function updateCompressionDetails(imageType, originalSize, compressedSize, compressionTime) {
  const compressionRatio = (originalSize / compressedSize).toFixed(2);
  const spaceSaving = ((1 - compressedSize / originalSize) * 100).toFixed(2);

  const detail = {
    imageType: imageType,
    originalSize: originalSize,
    compressedSize: compressedSize,
    compressionTime: compressionTime,
    compressionRatio: compressionRatio,
    spaceSaving: spaceSaving,
  };

  compressionDetails.push(detail);
  updateDetailsTable();
}

function updateDetailsTable() {
  // Clear existing details
  detailsBody.innerHTML = '';

  // Update the table with compression details
  for (var i = 0; i < compressionDetails.length; i++) {
    var detail = compressionDetails[i];

    var row = detailsBody.insertRow(i);
    row.insertCell(0).textContent = detail.imageType;
    row.insertCell(1).textContent = detail.originalSize;
    row.insertCell(2).textContent = detail.compressedSize;
    row.insertCell(3).textContent = detail.compressionTime;
    row.insertCell(4).textContent = detail.compressionRatio;
    row.insertCell(5).textContent = detail.spaceSaving + '%';
  }
}

function resetValues() {
  document.getElementById('imageDimensions').value = 50;
  document.getElementById('dimensionValue').textContent = '50%';
  document.getElementById('frameRatioNumerator').value = '';
  document.getElementById('frameRatioDenominator').value = '';
  document.getElementById('frameRatios').value = '1';
  document.getElementById('compressionSize').value = '';
  document.getElementById('imageName').value = '';
  resultImage.src = '';
  compressionDetails = [];
  updateDetailsTable();
  updateDimensions(); // Reset live preview
}
