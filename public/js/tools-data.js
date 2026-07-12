// ===== NEXKITTOOL - TOOLS DATA =====
const TOOLS = [
  // AI TOOLS
  { id:'essay', cat:'ai', icon:'📝', name:'Essay Writer', desc:'Write full essays in seconds with AI', keywords:['essay','write','content','ai','writing'] },
  { id:'grammar', cat:'ai', icon:'✍️', name:'Grammar Fixer', desc:'Fix grammar, spelling & punctuation instantly', keywords:['grammar','spelling','fix','correct','proofread'] },
  { id:'rewriter', cat:'ai', icon:'🔄', name:'Article Rewriter', desc:'Rewrite any text without changing the meaning', keywords:['rewrite','paraphrase','rephrase','article'] },
  { id:'summarizer', cat:'ai', icon:'📋', name:'Text Summarizer', desc:'Summarize long articles & documents instantly', keywords:['summarize','summary','short','brief','condense'] },
  { id:'translator', cat:'ai', icon:'🌐', name:'Language Translator', desc:'Translate text to 50+ languages for free', keywords:['translate','translator','language','convert'] },
  { id:'hashtag', cat:'ai', icon:'#️⃣', name:'Hashtag Generator', desc:'Generate trending hashtags for social media', keywords:['hashtag','social media','instagram','twitter','tags'] },
  { id:'paraphrase', cat:'ai', icon:'💬', name:'Paraphrase Tool', desc:'Paraphrase text in multiple styles', keywords:['paraphrase','rephrase','reword','change'] },
  { id:'plagiarism', cat:'ai', icon:'🔍', name:'Plagiarism Checker', desc:'Check your content for plagiarism free', keywords:['plagiarism','check','duplicate','unique','original'] },
  { id:'humanizer', cat:'ai', icon:'🧑‍💻', name:'AI Humanizer', desc:'Make AI-generated text sound natural and human', keywords:['humanize','ai humanizer','human','natural','undetectable'] },
  // IMAGE TOOLS
  { id:'bgremove', cat:'image', icon:'🎭', name:'Background Remover', desc:'Remove image background in one click', keywords:['background','remove','transparent','bg','cut'] },
  { id:'resize', cat:'image', icon:'📐', name:'Image Resizer', desc:'Resize images to any dimension for free', keywords:['resize','dimension','size','scale','image'] },
  { id:'compress', cat:'image', icon:'🗜️', name:'Image Compressor', desc:'Compress images without losing quality', keywords:['compress','reduce','size','optimize','image'] },
  { id:'watermark', cat:'image', icon:'💧', name:'Add Watermark', desc:'Add text or image watermark to photos', keywords:['watermark','brand','logo','text','stamp'] },
  { id:'grayscale', cat:'image', icon:'⚫', name:'Black & White Filter', desc:'Convert images to black and white', keywords:['grayscale','black white','filter','mono','bw'] },
  { id:'flip', cat:'image', icon:'↔️', name:'Flip & Rotate', desc:'Flip or rotate images easily', keywords:['flip','rotate','mirror','turn','image'] },
  { id:'crop', cat:'image', icon:'✂️', name:'Image Cropper', desc:'Crop images to exact dimensions', keywords:['crop','cut','trim','image'] },
  { id:'convert', cat:'image', icon:'🔁', name:'Image Converter', desc:'Convert JPG, PNG, WEBP, GIF, BMP', keywords:['convert','jpg','png','webp','gif','format'] },
  // PDF TOOLS
  { id:'img2pdf', cat:'pdf', icon:'🖼️', name:'Image to PDF', desc:'Convert JPG/PNG images to PDF free', keywords:['image to pdf','jpg to pdf','png to pdf','convert'] },
  { id:'pdf2img', cat:'pdf', icon:'📷', name:'PDF to Image', desc:'Convert PDF pages to JPG/PNG images', keywords:['pdf to image','pdf to jpg','pdf to png','convert'] },
  { id:'merge', cat:'pdf', icon:'📎', name:'Merge PDF', desc:'Combine multiple PDF files into one', keywords:['merge pdf','combine','join','multiple','files'] },
  { id:'split', cat:'pdf', icon:'✂️', name:'Split PDF', desc:'Split PDF into individual pages or ranges', keywords:['split pdf','separate','extract pages','divide'] },
  { id:'compress-pdf', cat:'pdf', icon:'🗜️', name:'Compress PDF', desc:'Reduce PDF file size without quality loss', keywords:['compress pdf','reduce','smaller','optimize','size'] },
  { id:'pdf-watermark', cat:'pdf', icon:'💧', name:'PDF Watermark', desc:'Add watermark text to PDF documents', keywords:['pdf watermark','stamp','brand','text','mark'] },
  { id:'word2pdf', cat:'pdf', icon:'📄', name:'Word to PDF', desc:'Convert DOC/DOCX to PDF instantly', keywords:['word to pdf','doc to pdf','docx','convert','microsoft'] },
  { id:'pdf2word', cat:'pdf', icon:'📝', name:'PDF to Word', desc:'Convert PDF files to editable Word document', keywords:['pdf to word','pdf to doc','convert','editable'] },
  // UTILITY TOOLS
  { id:'qrcode', cat:'utility', icon:'📱', name:'QR Code Generator', desc:'Generate QR codes for links, text, WiFi', keywords:['qr code','qr','barcode','scan','generate'] },
  { id:'wordcount', cat:'utility', icon:'🔢', name:'Word Counter', desc:'Count words, characters, sentences & paragraphs', keywords:['word count','character count','words','letters'] },
  { id:'password', cat:'utility', icon:'🔐', name:'Password Generator', desc:'Generate strong secure passwords instantly', keywords:['password','secure','random','generator','strong'] },
  { id:'base64', cat:'utility', icon:'🔗', name:'Base64 Encoder', desc:'Encode & decode Base64 strings', keywords:['base64','encode','decode','binary','string'] },
  { id:'json', cat:'utility', icon:'{ }', name:'JSON Formatter', desc:'Format, validate and beautify JSON data', keywords:['json','format','validate','beautify','minify'] },
  { id:'lorem', cat:'utility', icon:'📃', name:'Lorem Ipsum', desc:'Generate placeholder lorem ipsum text', keywords:['lorem ipsum','placeholder','dummy','text','generate'] },
  { id:'urlencode', cat:'utility', icon:'🔗', name:'URL Encoder', desc:'Encode and decode URLs instantly', keywords:['url','encode','decode','percent','link'] },
  { id:'case', cat:'utility', icon:'Aa', name:'Case Converter', desc:'Convert text to uppercase, lowercase, title case', keywords:['case','upper','lower','title','capitalize','convert'] },
  // COLOR TOOLS
  { id:'colorpicker', cat:'color', icon:'🎨', name:'Color Picker', desc:'Pick colors and get HEX, RGB, HSL codes', keywords:['color','picker','hex','rgb','hsl','palette'] },
  { id:'gradient', cat:'color', icon:'🌈', name:'Gradient Maker', desc:'Create beautiful CSS gradient backgrounds', keywords:['gradient','css','background','color','generate'] },
  { id:'contrast', cat:'color', icon:'⚖️', name:'Contrast Checker', desc:'Check color contrast for accessibility (WCAG)', keywords:['contrast','accessibility','wcag','color','check'] },
  { id:'palette', cat:'color', icon:'🖌️', name:'AI Palette Generator', desc:'Generate beautiful color palettes with AI', keywords:['palette','color scheme','colors','ai','generate'] },
];

// PRO TOOLS - EMPTY = sab free!
const PRO_TOOLS = [];
