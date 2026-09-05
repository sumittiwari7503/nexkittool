# NexKitTool

[NexKitTool](https://nexkittool.com/) is a web-based productivity platform providing a suite of 37 free digital utility tools. The platform is designed to operate directly in modern web browsers without mandatory user registrations or software installations, offering tools for document processing, image manipulation, AI-assisted writing, and developer utilities.

---

## Tool Suite & Categories (37 Tools)

### 1. PDF Tools (8 Tools)
- **Split PDF:** Extract specific pages, ranges, or separate multi-page documents into individual files.
- **Merge PDF:** Combine multiple PDF documents into a single unified file.
- **Compress PDF:** Optimize and reduce PDF file size while preserving structural layout.
- **Image to PDF:** Convert JPG and PNG images into formatted PDF documents.
- **PDF to Image:** Render PDF pages into high-resolution JPG images (downloadable individually or as a ZIP).
- **PDF Watermark:** Apply customized text watermarks for document branding and protection.
- **Word to PDF & PDF to Word:** Document conversion between Microsoft Word (.doc/.docx) and PDF formats.

### 2. Image Tools (8 Tools)
- **Background Remover:** Client-side background removal.
- **Image Compressor:** Compress JPG, PNG, and WEBP images with adjustable quality controls.
- **Image Resizer:** Scale image width and height dimensions with aspect ratio preservation.
- **Image Cropper:** Crop photos to custom dimensions or standard aspect ratios.
- **Image Converter:** Convert between JPG, PNG, WEBP, GIF, and BMP formats.
- **Flip & Rotate:** Rotate images by 90°, 180°, or 270°, and flip horizontally or vertically.
- **Black & White Filter:** Convert full-color images to grayscale and monochrome.
- **Add Watermark:** Apply custom text and image overlays with configurable opacity.

### 3. AI Writing Tools (9 Tools)
Powered by Google Gemini API integration:
- **Essay Writer:** Generate structured essays across academic and creative writing formats.
- **Grammar Fixer:** Automated grammar, spelling, and punctuation correction.
- **Article Rewriter:** Rewrite paragraphs and articles with maintained semantic meaning.
- **Paraphrase Tool:** Rephrase sentences across multiple tone profiles.
- **Text Summarizer:** Condense long articles and documents into concise summaries.
- **AI Humanizer:** Adjust sentence flow and structure for natural readability.
- **Language Translator:** Translate text across 50+ languages.
- **Plagiarism Checker:** Scan text against common web patterns to verify originality.
- **Hashtag Generator:** Generate targeted hashtags for social media discovery.

### 4. Utility & Developer Tools (8 Tools)
- **JSON Formatter:** Validate, format, beautify, and minify JSON data structures.
- **Base64 Encoder / Decoder:** Encode and decode binary data and ASCII strings.
- **URL Encoder / Decoder:** Encode and decode special characters in URL strings.
- **QR Code Generator:** Create scannable QR codes for URLs, plain text, and WiFi networks.
- **Word Counter:** Real-time word, character, sentence, and paragraph counting.
- **Password Generator:** Generate cryptographically random, customizable passwords.
- **Case Converter:** Transform text to uppercase, lowercase, title case, and sentence case.
- **Lorem Ipsum Generator:** Generate dummy placeholder text for layouts and designs.

### 5. Color Tools (4 Tools)
- **Color Picker:** Extract color values across HEX, RGB, and HSL formats.
- **Gradient Maker:** Interactive CSS linear and radial gradient generator.
- **Contrast Checker:** Measure color contrast ratios against WCAG 2.1 accessibility standards.
- **AI Palette Generator:** Generate harmonious color palettes using AI recommendations.

---

## Technology Stack & Dependencies

- **Runtime & Server:** [Node.js](https://nodejs.org/) with [Express.js](https://expressjs.com/)
- **PDF Manipulation:** [pdf-lib](https://github.com/Hopding/pdf-lib), [pdfjs-dist](https://mozilla.github.io/pdf.js/), [pdf-to-img](https://github.com/mohabdelazem/pdf-to-img)
- **Image Processing Engine:** [sharp](https://github.com/lovell/sharp) and HTML5 Canvas API
- **AI Integration:** Google Gemini API (via REST endpoints)
- **Archive Utilities:** [jszip](https://stuk.github.io/jszip/)
- **Security & Middleware:** [helmet](https://github.com/helmetjs/helmet), [cors](https://github.com/expressjs/cors), [express-rate-limit](https://github.com/express-rate-limit/express-rate-limit), [compression](https://github.com/expressjs/compression), [morgan](https://github.com/expressjs/morgan), [dotenv](https://github.com/motdotla/dotenv)
- **Frontend Architecture:** Vanilla JavaScript (ES6+), Semantic HTML5, CSS3 with responsive layouts.

---

## Privacy & Processing Model

Data handling in NexKitTool operates under the following technical design:

1. **Client-Side Execution:** Many utilities (including JSON Formatter, Base64 Encoder, Color Picker, Gradient Maker, and client-side canvas image filters) execute locally within the user's web browser. Data processed by these tools is not transmitted to the NexKitTool application server.
2. **In-Memory Server Processing:** For server-processed image and PDF utilities (such as sharp image compression or pdf-lib document merging), uploads are handled in memory buffers via multer.memoryStorage() without being persisted to a database.
3. **Temporary Filesystem Usage:** Utilities that require file-path inputs for native libraries (such as pdf-to-img rendering) write temporary files to the operating system temp directory (os.tmpdir()) and delete them upon completion (fs.unlinkSync).
4. **Third-Party AI Processing:** AI writing tools transmit user-submitted text prompts to the Google Gemini API to generate responses.
5. **No Permanent Storage:** NexKitTool does not maintain permanent file storage, user document databases, or long-term file archives.

---

## Local Setup & Development

### Prerequisites
- [Node.js](https://nodejs.org/) (Active LTS version recommended, such as Node.js 18+ or 20+ to support modern native dependencies like sharp)
- [npm](https://www.npmjs.com/)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/sumittiwari7503/nexkittool.git
   cd nexkittool
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   Create a `.env` file in the project root:
   ```env
   PORT=3000
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. **Start the server:**
   ```bash
   npm start
   ```

5. **Access the application:**
   Open [Localhost](http://localhost:3000/) in your web browser.

---

## Official Links

- [Website](https://nexkittool.com/)
- [About](https://nexkittool.com/pages/about.html)
- [GitHub Repository](https://github.com/sumittiwari7503/nexkittool)
- [Support Contact](mailto:support@nexkittool.com)
