## How to add a video to the caregiver videos for a given targeted medical condition

1. Drop the file here, e.g. 'pneumonia.mp4'.
2. Register it in the videoAssets map in [`videoAssets.ts`](./videoAssets.ts), keyed by the
   video `id` used in [`src/data/careContent.json`](../../data/careContent.json):

   ```ts
   export const videoAssets: Record<string, VideoSource> = {
     'pneumonia': require('@/src/assets/videos/pneumonia.mp4'),
   };
   ```

3. Make sure the same id appears in careContent.json under the relevant condition's
   videos array (the JSON holds title/description; this map holds the file).

The `.mp4` files are gitignored so video files are not on the public repository.
