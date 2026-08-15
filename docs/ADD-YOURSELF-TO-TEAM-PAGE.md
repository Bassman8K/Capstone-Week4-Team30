# Add Yourself to the Team Page

No coding experience or local setup needed — this is all done through GitHub's
website. Takes about 5 minutes.

Each person does this **themselves**, from their own GitHub account — that's
what makes it count as your own commit on the assignment.

---

## 1. Upload your photo (optional)

1. Go to: https://github.com/Bassman8K/Capstone-Week4-Team30/tree/main/frontend/public/team
2. Click **Add file → Upload files**
3. Drag in your photo. Square photos look best. Name it your first name,
   lowercase, no spaces — e.g. `mei.jpg`
4. Scroll down to "Commit changes": write a short message like
   `Add Mei's photo`, choose **"Create a new branch for this commit and
   start a pull request"**, then click **Propose changes**
5. On the next screen, click **Create pull request**

Skip this step if you don't have a photo handy yet — a placeholder icon
shows instead until you add one.

## 2. Add your name, role, and blurb

1. Go to: https://github.com/Bassman8K/Capstone-Week4-Team30/blob/main/frontend/src/features/team/data.ts
2. Click the pencil (✏️) icon in the top right to edit the file
3. Find the entry matching your role (or, if there's no slot for you yet —
   e.g. a second Dev — copy one whole `{ ... }` block and paste it in as a
   new entry with a unique `id`)
4. Fill in:
   - `name`: your real name
   - `blurb`: one or two sentences about you
   - `photoUrl`: `/team/<your-file-name>` — matching what you uploaded in
     step 1. If you skipped step 1, delete the `photoUrl` line entirely.
5. Scroll down: same as before — **"Create a new branch for this commit and
   start a pull request"** → **Propose changes** → **Create pull request**

## 3. Get it merged

Ping Jonathan (or whoever's reviewing) to merge your PR. If someone else's
PR is still open when you start, it's worth waiting for theirs to merge
first — otherwise you might both be editing the same file at once and hit a
merge conflict.

Once merged, your info goes live automatically within a minute or two.
