import cv2
import numpy as np
import torch
from torchvision import transforms
from PIL import Image
import torchvision.models.segmentation as models

# Load the pre-trained DeepLabV3 model
model = models.deeplabv3_resnet101(pretrained=True).eval()

def segment_person(image):
    """Returns a binary mask where the person is detected."""
    preprocess = transforms.Compose([
        transforms.ToPILImage(),
        transforms.Resize((520, 520)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])
    
    input_tensor = preprocess(image).unsqueeze(0)
    with torch.no_grad():
        output = model(input_tensor)['out'][0]
    
    mask = output.argmax(0).byte().cpu().numpy()
    return (mask == 15).astype(np.uint8)  # Class 15 corresponds to "person"

def blur_background(image_path, save_path="blurred_bg.jpg"):
    """Blurs the background of a person in the given image and saves the result."""
    image = cv2.imread(image_path)
    image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

    # Get person segmentation mask
    mask = segment_person(image_rgb)

    # Resize mask to match original image size
    mask = cv2.resize(mask, (image.shape[1], image.shape[0]), interpolation=cv2.INTER_NEAREST)

    # Blur the entire image
    blurred = cv2.GaussianBlur(image, (35, 35), 0)

    # Combine the original person with the blurred background
    mask_3d = np.repeat(mask[:, :, np.newaxis], 3, axis=2)  # Convert mask to 3-channel
    result = np.where(mask_3d == 1, image, blurred)

    # Save the final output
    cv2.imwrite(save_path, result)
    print(f"Saved the blurred background image as {save_path}")

# Run the function on an image
blur_background("face_F.jpg")  # Replace with your image path
