import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

/**
 * Uploads images to the same Cloudinary account as the web app
 * (unsigned upload preset), used for review photos and payment receipts.
 */
@Injectable({ providedIn: 'root' })
export class CloudinaryService {
  /** Uploads one image file and returns its https URL. Throws an Error with a readable message. */
  async uploadImage(file: File, folder: string): Promise<string> {
    if (!file.type.startsWith('image/')) {
      throw new Error('Please choose an image file (JPG, PNG, etc).');
    }
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('Each image must be under 5MB.');
    }
    const cfg = environment.cloudinary;
    const form = new FormData();
    form.append('file', file);
    form.append('upload_preset', cfg.uploadPreset);
    form.append('folder', folder);

    const res = await fetch('https://api.cloudinary.com/v1_1/' + cfg.cloudName + '/image/upload', {
      method: 'POST',
      body: form
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error((json && json.error && json.error.message) || 'Image upload failed.');
    }
    return json.secure_url as string;
  }

  /** Uploads up to `max` images in order and returns their URLs. */
  async uploadMany(files: File[], folder: string, max = 3): Promise<string[]> {
    const urls: string[] = [];
    for (let i = 0; i < files.length && i < max; i++) {
      urls.push(await this.uploadImage(files[i], folder));
    }
    return urls;
  }
}
