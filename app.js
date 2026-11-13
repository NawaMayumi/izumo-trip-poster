import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";

/* ---------------------------------------------------------------- */
/* Trip data — the two-day itinerary, in visiting order              */
/* ---------------------------------------------------------------- */

const DAY_PALETTE = {
  1: { bg: "#f6e6da", ink: "#6e2f1f", accent: "#a0462f", label: "DAY 1", dateLabel: "11.14 SAT", dateShort: "11.14" },
  2: { bg: "#e1efe3", ink: "#1f4a3a", accent: "#2d6a4f", label: "DAY 2", dateLabel: "11.15 SUN", dateShort: "11.15" },
};

function mapsUrl(address) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

const TRIP_STOPS = [
  {
    day: 1, order: 1, time: "06:30", timeRange: "06:30", category: "移動", emoji: "🚗",
    title: "高知市内を出発", note: "途中で休憩しながら奥出雲へ",
    fullDescription: "高知市内から櫻井家住宅までは、途中の休憩込みで約5時間の道のりです。06:30発で11:30着を予定しています。朝早い出発なので、無理のないペースで進みましょう。",
    photo: "photos/kochi.jpg",
  },
  {
    day: 1, order: 2, time: "11:30", timeRange: "11:30–12:25", category: "見学", emoji: "🏯",
    title: "櫻井家住宅・可部屋集成館", note: "たたら製鉄で栄えた屋敷と庭園",
    fullDescription: "たたら製鉄で栄えた松江藩三大鉄師の一つ、櫻井家の屋敷と、滝のある庭園。公式の見学目安は資料館40分＋庭園20分ですが、今回は庭園を中心に20分ほど、資料館は気になる展示だけ見るとちょうど良いペースです。",
    photo: "photos/sakurai.jpg",
    parkingLabel: "来館者駐車場", parkingAddress: "島根県仁多郡奥出雲町上阿井1655",
  },
  {
    day: 1, order: 3, time: "12:25", timeRange: "12:25–13:50", category: "移動", emoji: "🚗",
    title: "出雲大社方面へ移動・駐車", note: "約57km・車で約80分。正門前へ徒歩約4分",
    fullDescription: "櫻井家住宅から出雲大社までは約57km、車で約80分。12:25発から13:50の昼食までは85分なので、駐車と徒歩を含めると余裕は少なめです。神門通り交通広場駐車場に停めて正門まで徒歩約4分です。",
    photo: "photos/izumo_torii.jpg",
    parkingLabel: "神門通り交通広場駐車場（正門まで徒歩約4分）", parkingAddress: "島根県出雲市大社町杵築南878-3",
    altParkingNote: "満車時：みせん広場駐車場（島根県出雲市大社町修理免1425-1／正門まで徒歩約9分）",
  },
  {
    day: 1, order: 4, time: "13:50", timeRange: "13:50–14:30", category: "昼食", emoji: "🍽",
    title: "のどぐろ丼で昼食", note: "出雲日本海 出雲大社正門前店｜ご縁横丁",
    fullDescription: "大社の参道入口「勢溜」の向かい、ご縁横丁にあるお店。名物ののどぐろ丼にはしじみ汁が付きます。通常9:00〜17:00営業。店専用の駐車場はなく、神門通り交通広場駐車場を利用します。",
    photo: "photos/nodoguro.jpg",
    placeName: "出雲日本海 出雲大社正門前店", placeAddress: "島根県出雲市大社町杵築南840-1 ご縁横丁",
    sharedParkingOf: 3, sharedNote: "出雲大社の昼食・参拝・街ブラの駐車場は共通です",
  },
  {
    day: 1, order: 5, time: "14:30", timeRange: "14:30–16:00", category: "参拝", emoji: "⛩",
    title: "出雲大社を参拝", note: "勢溜→参道→拝殿→御本殿→素鵞社→神楽殿",
    fullDescription: "勢溜→参道→拝殿→御本殿周辺→素鵞社→神楽殿の順で回ると、境内と大しめ縄まで一通り見られます。観光協会の目安は勢溜から60〜90分。素鵞社は16:30までなので、昼食が押した場合は先に素鵞社へ向かうと安心です。",
    photo: "photos/taisha.jpg",
    sharedParkingOf: 3, sharedNote: "出雲大社の昼食・参拝・街ブラはこの駐車場を利用します",
  },
  {
    day: 1, order: 6, time: "16:00", timeRange: "16:00–16:50", category: "散策", emoji: "🛍",
    title: "神門通りを街ブラ", note: "ご縁横丁・出雲大社前駅・お土産",
    fullDescription: "勢溜から出雲大社前駅方向へ続く門前町。ご縁横丁でぜんざい餅・焼き鯖寿司・めのうの小物などを覗きつつ、気になるお店に寄るくらいがちょうど良い散策です。",
    photo: "photos/gomonstreet.jpg",
    sharedParkingOf: 3, sharedNote: "出雲大社の昼食・参拝・街ブラはこの駐車場を利用します",
  },
  {
    day: 1, order: 7, time: "17:20頃", timeRange: "17:20頃", category: "宿泊", emoji: "🏨",
    title: "平田の宿にチェックイン", note: "出雲大社から車で約30分",
    fullDescription: "出雲大社から車で約30分。宿にチェックインします。ナビは出雲市平田町950-30。",
    parkingLabel: "敷地内の駐車場", parkingAddress: "〒691-0001 島根県出雲市平田町950-30",
  },
  {
    day: 2, order: 8, time: "07:45", timeRange: "07:45", category: "移動", emoji: "🚗",
    title: "平田の宿を出発", note: "足立美術館まで約75分",
    fullDescription: "チェックアウトを済ませて足立美術館へ向かいます。平田の宿から足立美術館までは約75分の道のりです。",
  },
  {
    day: 2, order: 9, time: "09:00", timeRange: "09:00–11:45", category: "鑑賞", emoji: "🖼",
    title: "足立美術館", note: "庭園と「侍」展、院展は11/15最終日",
    fullDescription: "枯山水庭と、窓枠を額縁に見立てた庭園の眺めを先に楽しみ、そのあと本館の秋季特別展「侍－日本画の革新に挑んだ7人－」へ。新館の院展は11/15が最終日です。開館9:00〜17:00、事前予約は不要。",
    photo: "photos/adachi.jpg",
    parkingLabel: "無料来館者駐車場（普通車400台）", parkingAddress: "島根県安来市古川町320",
  },
  {
    day: 2, order: 10, time: "12:20", timeRange: "12:20–13:20", category: "昼食", emoji: "🍽",
    title: "米子・ローリエで昼食", note: "ソース15種類のオムライスが看板",
    fullDescription: "ソースの種類が豊富なオムライスが看板の洋食屋。日曜の昼なので、入店待ちも想定して1時間の枠を確保しています。足立美術館からは約35分です。",
    photo: "photos/laurier.jpg",
    parkingLabel: "店舗駐車場（16台）", parkingAddress: "鳥取県米子市両三柳271",
  },
  {
    day: 2, order: 11, time: "14:00", timeRange: "14:00–15:15", category: "鑑賞", emoji: "📷",
    title: "植田正治写真美術館", note: "企画展と大山の眺め。最終入館16:30",
    fullDescription: "企画展「植田正治 まなざしの輝き」を中心に、建物と大山の眺めも楽しめます。展示に50〜60分、建築や外観に15分ほどが目安。開館10:00〜17:00、最終入館16:30。ローリエからは約40分です。",
    photo: "photos/ueda.jpg",
    parkingLabel: "無料来館者駐車場（普通車100台）", parkingAddress: "鳥取県西伯郡伯耆町須村353-3",
  },
  {
    day: 2, order: 12, time: "15:15", timeRange: "15:15", category: "移動", emoji: "🚗",
    title: "神山方面へ移動", note: "途中で休憩・夕食",
    fullDescription: "高知・神山方面へ向けて移動します。15:15発で、途中の休憩・夕食込みで約5時間15分〜5時間30分を見込んでいます。",
  },
  {
    day: 2, order: 13, time: "20:30頃", timeRange: "20:30–20:45頃", category: "休憩", emoji: "🅿️",
    title: "神山に立ち寄り", note: "高専付近で15分ほど",
    fullDescription: "神山まるごと高専の付近に15分ほど立ち寄ります。四国山地の懐、すだちの産地としても知られる里山の町です。",
    photo: "photos/kamiyama.jpg",
  },
  {
    day: 2, order: 14, time: "23:15頃", timeRange: "23:15–23:45頃", category: "到着", emoji: "🏁",
    title: "高知市内に到着", note: "神山から車で約2時間半〜2時間45分",
    fullDescription: "神山での立ち寄り後、車で約2時間半〜2時間45分。高知市内に到着し、2日間の旅はここで終わりです。",
    photo: "photos/kochi.jpg",
  },
];

// Each stop resolves to at most one map pin: its own place (when this stop
// is itself a distinct addressable spot, like the のどぐろ丼 restaurant),
// otherwise its own parking lot, otherwise a shared parking lot borrowed
// from an earlier stop. mapKind picks the button wording.
TRIP_STOPS.forEach((stop) => {
  stop.palette = DAY_PALETTE[stop.day];
  stop.orderLabel = String(stop.order).padStart(2, "0");
  if (stop.placeAddress) {
    stop.mapAddress = stop.placeAddress;
    stop.mapLabel = stop.placeName;
    stop.mapKind = "place";
  } else if (stop.sharedParkingOf) {
    const source = TRIP_STOPS.find((s) => s.order === stop.sharedParkingOf);
    stop.mapAddress = source.parkingAddress;
    stop.mapLabel = source.parkingLabel;
    stop.mapKind = "shared-parking";
  } else if (stop.parkingAddress) {
    stop.mapAddress = stop.parkingAddress;
    stop.mapLabel = stop.parkingLabel;
    stop.mapKind = "parking";
  }
});

/* ---------------------------------------------------------------- */
/* Photo preloading                                                   */
/* ---------------------------------------------------------------- */

function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

const imageCache = {};
await Promise.all(
  TRIP_STOPS.filter((s) => s.photo).map(async (s) => {
    imageCache[s.order] = await loadImage(s.photo);
  })
);

function drawImageCover(ctx, img, x, y, w, h) {
  const ir = img.naturalWidth / img.naturalHeight;
  const r = w / h;
  let sx, sy, sw, sh;
  if (ir > r) {
    sh = img.naturalHeight;
    sw = sh * r;
    sx = (img.naturalWidth - sw) / 2;
    sy = 0;
  } else {
    sw = img.naturalWidth;
    sh = sw / r;
    sx = 0;
    sy = (img.naturalHeight - sh) / 2;
  }
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

function roundRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/* ---------------------------------------------------------------- */
/* Canvas texture — draws one hanging "card" per stop                */
/* ---------------------------------------------------------------- */

function fitFontSize(ctx, text, maxWidth, startSize, weight, minSize = 20) {
  let size = startSize;
  ctx.font = `${weight} ${size}px -apple-system, "Hiragino Sans", Arial`;
  while (ctx.measureText(text).width > maxWidth && size > minSize) {
    size -= 2;
    ctx.font = `${weight} ${size}px -apple-system, "Hiragino Sans", Arial`;
  }
  return size;
}

function drawCardTexture(stop) {
  const W = 512;
  const H = 680;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  const { bg, ink, accent, label } = stop.palette;

  roundRect(ctx, 6, 6, W - 12, H - 12, 18);
  ctx.fillStyle = bg;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = "rgba(0,0,0,0.08)";
  ctx.stroke();

  ctx.strokeStyle = "rgba(0,0,0,0.035)";
  ctx.lineWidth = 1;
  for (let y = 60; y < H - 40; y += 26) {
    ctx.beginPath();
    ctx.moveTo(28, y);
    ctx.lineTo(W - 28, y);
    ctx.stroke();
  }

  // day pill, top-left
  roundRect(ctx, 26, 24, 130, 40, 6);
  ctx.fillStyle = accent;
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.font = "bold 20px -apple-system, Arial";
  ctx.textBaseline = "middle";
  ctx.fillText(label, 44, 45);

  // the ONE clear time display — top-right, bold
  ctx.save();
  ctx.font = "800 26px -apple-system, Arial";
  ctx.fillStyle = ink;
  ctx.textAlign = "right";
  ctx.fillText(stop.time, W - 30, 45);
  ctx.restore();
  ctx.textBaseline = "alphabetic";

  // order number (no "/14" — it collided with the digits)
  ctx.textAlign = "left";
  ctx.fillStyle = accent;
  ctx.font = "800 54px -apple-system, Arial";
  ctx.fillText(stop.orderLabel, 30, 148);

  // title (auto-fit)
  ctx.fillStyle = ink;
  const titleSize = fitFontSize(ctx, stop.title, W - 60, 32, "800", 18);
  ctx.font = `800 ${titleSize}px -apple-system, "Hiragino Sans", Arial`;
  ctx.fillText(stop.title, 30, 198);

  ctx.strokeStyle = "rgba(0,0,0,0.15)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(30, 224);
  ctx.lineTo(W - 30, 224);
  ctx.stroke();

  // category row (no time here — time is shown once, above)
  ctx.font = "bold 22px -apple-system, Arial";
  ctx.fillStyle = ink;
  ctx.fillText(`${stop.emoji} ${stop.category}`, 30, 258);

  // note (wrapped, 2 lines max)
  ctx.font = "16px -apple-system, \"Hiragino Sans\", Arial";
  ctx.fillStyle = "rgba(0,0,0,0.6)";
  wrapTextClamped(ctx, stop.note, 30, 292, W - 60, 22, 2);

  // photo thumbnail if we have one, otherwise a big rotated category stamp
  const img = imageCache[stop.order];
  if (img) {
    const pw = 300, ph = 190, px = (W - pw) / 2, py = 340;
    ctx.save();
    ctx.translate(px + pw / 2, py + ph / 2);
    ctx.rotate(-0.025);
    roundRectPath(ctx, -pw / 2, -ph / 2, pw, ph, 10);
    ctx.save();
    ctx.clip();
    drawImageCover(ctx, img, -pw / 2, -ph / 2, pw, ph);
    ctx.restore();
    ctx.lineWidth = 6;
    ctx.strokeStyle = "#fff";
    roundRectPath(ctx, -pw / 2, -ph / 2, pw, ph, 10);
    ctx.stroke();
    ctx.restore();
  } else {
    ctx.save();
    ctx.translate(W / 2, 440);
    ctx.rotate(-0.08);
    ctx.globalAlpha = 0.85;
    ctx.font = "120px -apple-system, Arial";
    ctx.textAlign = "center";
    ctx.fillText(stop.emoji, 0, 0);
    ctx.restore();
  }

  // bottom table — date / category / map pin (time already shown once above)
  const bottomY = H - 70;
  const mapValue = stop.mapAddress ? (stop.mapKind === "shared-parking" ? "共通" : "あり") : "ー";
  [
    ["日付", stop.palette.dateShort],
    ["区分", stop.category],
    ["地図", mapValue],
  ].forEach((row, idx) => {
    const x = 30 + idx * 160;
    ctx.textAlign = "left";
    ctx.font = "11px -apple-system, Arial";
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.fillText(row[0], x, bottomY);
    fitAndDraw(ctx, row[1], x, bottomY + 22, 150, 15, ink);
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function fitAndDraw(ctx, text, x, y, maxWidth, startSize, color) {
  let size = startSize;
  ctx.font = `bold ${size}px -apple-system, Arial`;
  while (ctx.measureText(text).width > maxWidth && size > 9) {
    size -= 1;
    ctx.font = `bold ${size}px -apple-system, Arial`;
  }
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
}

function wrapTextClamped(ctx, text, x, y, maxWidth, lineHeight, maxLines) {
  const chars = text.split("");
  const lines = [];
  let line = "";
  chars.forEach((ch) => {
    const test = line + ch;
    if (line && ctx.measureText(test).width > maxWidth) {
      lines.push(line);
      line = ch;
    } else {
      line = test;
    }
  });
  if (line) lines.push(line);
  lines.slice(0, maxLines).forEach((l, i) => ctx.fillText(l, x, y + i * lineHeight));
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/* ---------------------------------------------------------------- */
/* Scene setup                                                       */
/* ---------------------------------------------------------------- */

const wrap = document.getElementById("canvas-wrap");
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf7f4ec);
scene.fog = new THREE.Fog(0xf7f4ec, 14, 30);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);

const RAIL_Y = 2.4;
const RAIL_RADIUS = 4.6;
const CARD_W = 1.0;
const CARD_H = 1.32;

const HANGER_HOOK_BASE_Y = -0.12;
const HANGER_APEX_Y = -0.4;
const HANGER_SHOULDER_Y = -0.8;
const HANGER_HALF_W = CARD_W * 0.74;

camera.position.set(0, RAIL_Y - 1.3, RAIL_RADIUS + 5.5);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
wrap.appendChild(renderer.domElement);

const pmremGenerator = new THREE.PMREMGenerator(renderer);
scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const warpPass = new ShaderPass({
  uniforms: { tDiffuse: { value: null } },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    varying vec2 vUv;
    void main() {
      float nx = vUv.x * 2.0 - 1.0;
      float edge = pow(abs(nx), 4.0);
      float stretch = edge * 0.4;
      float y = clamp((vUv.y - 0.5) * (1.0 - stretch) + 0.5, 0.0, 1.0);
      vec2 uvG = vec2(vUv.x, y);
      float caShift = 0.013 * edge * sign(nx);
      vec2 uvR = clamp(uvG + vec2(caShift, 0.0), 0.0, 1.0);
      vec2 uvB = clamp(uvG - vec2(caShift, 0.0), 0.0, 1.0);
      float r = texture2D(tDiffuse, uvR).r;
      float g = texture2D(tDiffuse, uvG).g;
      float b = texture2D(tDiffuse, uvB).b;
      gl_FragColor = vec4(r, g, b, 1.0);
    }
  `,
});
warpPass.renderToScreen = true;
composer.addPass(warpPass);

scene.add(new THREE.AmbientLight(0xffffff, 0.45));
const key = new THREE.DirectionalLight(0xffffff, 1.2);
key.position.set(6, 10, 6);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
key.shadow.camera.near = 1;
key.shadow.camera.far = 24;
key.shadow.camera.left = -7;
key.shadow.camera.right = 7;
key.shadow.camera.top = 7;
key.shadow.camera.bottom = -7;
key.shadow.bias = -0.0015;
key.shadow.radius = 2.5;
scene.add(key);
const fill = new THREE.DirectionalLight(0xffffff, 0.4);
fill.position.set(-6, 4, -4);
scene.add(fill);

const FLOOR_Y = RAIL_Y + HANGER_SHOULDER_Y - CARD_H - 0.35;
const floorGeo = new THREE.CircleGeometry(16, 48);
const floorMat = new THREE.MeshStandardMaterial({ color: 0xf2efe4, roughness: 1, envMapIntensity: 0 });
const floor = new THREE.Mesh(floorGeo, floorMat);
floor.rotation.x = -Math.PI / 2;
floor.position.y = FLOOR_Y;
floor.receiveShadow = true;
scene.add(floor);

/* ---------------------------------------------------------------- */
/* Rack: ceiling rods + circular rail                                 */
/* ---------------------------------------------------------------- */

const railMat = new THREE.MeshStandardMaterial({ color: 0x2c2f33, metalness: 0.9, roughness: 0.32 });
const hangerMat = new THREE.MeshStandardMaterial({ color: 0xc7ccd1, metalness: 1, roughness: 0.14 });
const clipMat = new THREE.MeshStandardMaterial({ color: 0x232527, metalness: 0.5, roughness: 0.4 });

const rackGroup = new THREE.Group();
scene.add(rackGroup);

const railGeo = new THREE.TorusGeometry(RAIL_RADIUS, 0.05, 16, 64);
const rail = new THREE.Mesh(railGeo, railMat);
rail.rotation.x = Math.PI / 2;
rail.position.y = RAIL_Y;
rail.castShadow = true;
rackGroup.add(rail);

const ROD_COUNT = 6;
for (let i = 0; i < ROD_COUNT; i++) {
  const a = (i / ROD_COUNT) * Math.PI * 2;
  const rx = Math.cos(a) * (RAIL_RADIUS - 0.4);
  const rz = Math.sin(a) * (RAIL_RADIUS - 0.4);
  const rodGeo = new THREE.CylinderGeometry(0.035, 0.035, 2.4, 10);
  const rod = new THREE.Mesh(rodGeo, railMat);
  rod.position.set(rx, RAIL_Y + 1.25, rz);
  rod.castShadow = true;
  rackGroup.add(rod);

  const bracketGeo = new THREE.BoxGeometry(0.14, 0.1, 0.14);
  const bracket = new THREE.Mesh(bracketGeo, railMat);
  bracket.position.set(rx, RAIL_Y, rz);
  rackGroup.add(bracket);
}

/* ---------------------------------------------------------------- */
/* Hanging cards                                                      */
/* ---------------------------------------------------------------- */

const cardMeshes = [];
const cardGroups = [];

function makeHanger() {
  const group = new THREE.Group();
  const wireRadius = 0.024;

  const hookPts = [
    new THREE.Vector3(0, HANGER_HOOK_BASE_Y, 0),
    new THREE.Vector3(0.065, -0.05, 0),
    new THREE.Vector3(0.085, 0.03, 0),
    new THREE.Vector3(0.055, 0.1, 0),
    new THREE.Vector3(0, 0.1, 0),
    new THREE.Vector3(-0.045, 0.06, 0),
    new THREE.Vector3(-0.045, 0.0, 0),
  ];
  const hookCurve = new THREE.CatmullRomCurve3(hookPts);
  const hookGeo = new THREE.TubeGeometry(hookCurve, 32, wireRadius, 8, false);
  const hook = new THREE.Mesh(hookGeo, hangerMat);
  hook.castShadow = true;
  group.add(hook);

  const stemLen = HANGER_APEX_Y - HANGER_HOOK_BASE_Y;
  const stemGeo = new THREE.CylinderGeometry(wireRadius * 0.85, wireRadius * 0.85, stemLen + 0.03, 8);
  const stem = new THREE.Mesh(stemGeo, hangerMat);
  stem.position.y = (HANGER_APEX_Y + HANGER_HOOK_BASE_Y) / 2;
  stem.castShadow = true;
  group.add(stem);

  const armPts = [
    new THREE.Vector3(-HANGER_HALF_W, HANGER_SHOULDER_Y, 0),
    new THREE.Vector3(0, HANGER_APEX_Y, 0),
    new THREE.Vector3(HANGER_HALF_W, HANGER_SHOULDER_Y, 0),
  ];
  const armCurve = new THREE.CatmullRomCurve3(armPts);
  const armGeo = new THREE.TubeGeometry(armCurve, 24, wireRadius, 8, false);
  const arms = new THREE.Mesh(armGeo, hangerMat);
  arms.castShadow = true;
  group.add(arms);

  const bottomGeo = new THREE.CylinderGeometry(wireRadius, wireRadius, HANGER_HALF_W * 2, 8);
  const bottom = new THREE.Mesh(bottomGeo, hangerMat);
  bottom.rotation.z = Math.PI / 2;
  bottom.position.y = HANGER_SHOULDER_Y;
  bottom.castShadow = true;
  group.add(bottom);

  return group;
}

function armYAtX(absX) {
  const t = THREE.MathUtils.clamp((HANGER_HALF_W - absX) / HANGER_HALF_W, 0, 1);
  return HANGER_SHOULDER_Y + t * (HANGER_APEX_Y - HANGER_SHOULDER_Y);
}

function makeClips(cardTopY) {
  const group = new THREE.Group();
  [-1, 1].forEach((side) => {
    const clipX = side * CARD_W * 0.42;
    const armY = armYAtX(Math.abs(clipX));
    const clipHeight = armY - cardTopY;
    if (clipHeight < 0.015) return;

    const pinGeo = new THREE.CylinderGeometry(0.012, 0.012, clipHeight, 6);
    const pin = new THREE.Mesh(pinGeo, clipMat);
    pin.position.set(clipX, (armY + cardTopY) / 2, 0.012);
    pin.castShadow = true;
    group.add(pin);

    const headGeo = new THREE.BoxGeometry(0.06, 0.035, 0.05);
    const head = new THREE.Mesh(headGeo, clipMat);
    head.position.set(clipX, cardTopY + 0.015, 0.018);
    head.castShadow = true;
    group.add(head);
  });
  return group;
}

// Cards are placed going around the rack in visiting order. The angle is
// negated so that rotating/dragging the natural way encounters stop 01
// before stop 14, instead of the reverse.
TRIP_STOPS.forEach((stop, i) => {
  const angle = -((i / TRIP_STOPS.length) * Math.PI * 2) + (Math.sin(i * 12.9) * 0.04);
  const x = Math.cos(angle) * RAIL_RADIUS;
  const z = Math.sin(angle) * RAIL_RADIUS;

  const holder = new THREE.Group();
  holder.position.set(x, RAIL_Y, z);
  holder.rotation.y = -angle + Math.PI / 2;
  holder.rotation.z = (Math.sin(i * 7.3) * 0.05);
  rackGroup.add(holder);

  const hanger = makeHanger();
  holder.add(hanger);

  const texture = drawCardTexture(stop);
  const cardGeo = new THREE.PlaneGeometry(CARD_W, CARD_H);
  const cardMat = new THREE.MeshStandardMaterial({
    map: texture,
    roughness: 0.85,
    metalness: 0,
    side: THREE.DoubleSide,
  });
  const card = new THREE.Mesh(cardGeo, cardMat);
  card.position.y = HANGER_SHOULDER_Y - CARD_H / 2 + 0.05;
  card.castShadow = true;
  card.receiveShadow = true;
  card.userData.stop = stop;
  card.userData.holder = holder;
  card.userData.angle = angle;
  holder.add(card);

  const cardTopY = HANGER_SHOULDER_Y + 0.05;
  holder.add(makeClips(cardTopY));

  cardMeshes.push(card);
  cardGroups.push({ holder, baseRotZ: holder.rotation.z, phase: i * 1.37, card });
});

/* ---------------------------------------------------------------- */
/* Controls                                                           */
/* ---------------------------------------------------------------- */

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, RAIL_Y - 1.4, 0);
controls.enablePan = false;
controls.minDistance = RAIL_RADIUS + 2.3;
controls.maxDistance = RAIL_RADIUS + 9;
controls.minPolarAngle = Math.PI * 0.32;
controls.maxPolarAngle = Math.PI * 0.56;
controls.autoRotate = true;
controls.autoRotateSpeed = -0.45;
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.update();

let idleTimer = null;

function pauseAutoRotate() {
  controls.autoRotate = false;
  clearTimeout(idleTimer);
}
function scheduleResume(delay = 2600) {
  clearTimeout(idleTimer);
  idleTimer = setTimeout(() => {
    controls.autoRotate = true;
  }, delay);
}
function onUserInteractionStart() {
  pauseAutoRotate();
}
controls.domElement.addEventListener("pointerdown", onUserInteractionStart);
controls.domElement.addEventListener("pointerup", () => scheduleResume());
controls.domElement.addEventListener("wheel", () => { onUserInteractionStart(); scheduleResume(); }, { passive: true });

/* ---------------------------------------------------------------- */
/* Selection — a single click opens that stop's own slide deck         */
/* directly; there is no separate side detail panel.                  */
/* ---------------------------------------------------------------- */

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

function onPointerClick(event) {
  if (inRoom) return;
  pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(cardMeshes, false);
  if (hits.length > 0) {
    openStopDeck(hits[0].object.userData.stop);
  }
}
renderer.domElement.addEventListener("click", onPointerClick);

function onPointerMove(event) {
  if (inRoom) return;
  pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(cardMeshes, false);
  renderer.domElement.style.cursor = hits.length > 0 ? "pointer" : "grab";
}
renderer.domElement.addEventListener("pointermove", onPointerMove);

/* ---------------------------------------------------------------- */
/* Stop deck — a flat, scrolling mini-gallery of 2-3 portrait slides   */
/* for ONE stop: a photo cover, a details slide, and (if relevant) a   */
/* parking slide. The Google Maps button lives inside this deck, not   */
/* in a separate side panel.                                           */
/* ---------------------------------------------------------------- */

function wrapText(ctx, text, x, y, maxWidth, lineHeight, maxLines = Infinity) {
  const chars = text.split("");
  const lines = [];
  let line = "";
  chars.forEach((ch) => {
    const test = line + ch;
    if (line && ctx.measureText(test).width > maxWidth) {
      lines.push(line);
      line = ch;
    } else {
      line = test;
    }
  });
  if (line) lines.push(line);
  lines.slice(0, maxLines).forEach((l, i) => ctx.fillText(l, x, y + i * lineHeight));
  return Math.min(lines.length, maxLines);
}

const ROOM_POSITION = new THREE.Vector3(0, FLOOR_Y, -30);

const roomGroup = new THREE.Group();
roomGroup.position.copy(ROOM_POSITION);
roomGroup.visible = false;
scene.add(roomGroup);

const SLIDE_W = 2.7;
const SLIDE_H = 4.0;
const GALLERY_GAP = 0.4;
const TOP_Y = 2.1;
const PX_PER_UNIT = 300;

const WINDOW_WIDTH = 9;
const WINDOW_HEIGHT = SLIDE_H + 0.6;
const WINDOW_CENTER_Y = TOP_Y - SLIDE_H / 2;
const screenWorldCenter = new THREE.Vector3(0, WINDOW_CENTER_Y, 0).add(ROOM_POSITION);
const clipPlanes = [
  new THREE.Plane(new THREE.Vector3(1, 0, 0), -(screenWorldCenter.x - WINDOW_WIDTH / 2)),
  new THREE.Plane(new THREE.Vector3(-1, 0, 0), screenWorldCenter.x + WINDOW_WIDTH / 2),
  new THREE.Plane(new THREE.Vector3(0, -1, 0), screenWorldCenter.y + WINDOW_HEIGHT / 2),
  new THREE.Plane(new THREE.Vector3(0, 1, 0), -(screenWorldCenter.y - WINDOW_HEIGHT / 2)),
];
renderer.localClippingEnabled = true;

const reel = new THREE.Group();
roomGroup.add(reel);
let slideMeshes = [];

function disposeSlides() {
  slideMeshes.forEach((mesh) => {
    reel.remove(mesh);
    mesh.geometry.dispose();
    mesh.material.map.dispose();
    mesh.material.dispose();
  });
  slideMeshes = [];
}

function newSlideCanvas() {
  const W = Math.round(SLIDE_W * PX_PER_UNIT);
  const H = Math.round(SLIDE_H * PX_PER_UNIT);
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  return { canvas, ctx: canvas.getContext("2d"), W, H };
}

function finishSlide(canvas) {
  const ctx = canvas.getContext("2d");
  ctx.strokeStyle = "rgba(0,0,0,0.14)";
  ctx.lineWidth = 3;
  ctx.strokeRect(1.5, 1.5, canvas.width - 3, canvas.height - 3);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// slide 1: a full-bleed photo (or a themed fallback) with the place name
// and the one clear time readout overlaid at the bottom
function drawCoverSlide(stop) {
  const { canvas, ctx, W, H } = newSlideCanvas();
  const { accent, ink, label, dateLabel } = stop.palette;
  const pad = W * 0.08;
  const img = imageCache[stop.order];

  if (img) {
    drawImageCover(ctx, img, 0, 0, W, H);
  } else {
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, accent);
    grad.addColorStop(1, ink);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 0.82;
    ctx.font = `${H * 0.18}px -apple-system, Arial`;
    ctx.textAlign = "center";
    ctx.fillText(stop.emoji, W / 2, H * 0.42);
    ctx.globalAlpha = 1;
    ctx.textAlign = "left";
  }

  // top day/time chip
  const chipW = ctx.measureText ? null : null;
  ctx.font = `700 ${H * 0.024}px -apple-system, Arial`;
  const chipText = `${label} ・ ${dateLabel}`;
  const chipTextW = ctx.measureText(chipText).width;
  roundRectPath(ctx, pad - 14, H * 0.045, chipTextW + 28, H * 0.045, 999);
  ctx.fillStyle = "rgba(0,0,0,0.45)";
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.textBaseline = "middle";
  ctx.fillText(chipText, pad, H * 0.045 + H * 0.0225 + 1);
  ctx.textBaseline = "alphabetic";

  // bottom scrim + title + the one clear time — kept well clear of the
  // very bottom edge, since the floating map button sits just below
  const scrimH = H * 0.45;
  const scrim = ctx.createLinearGradient(0, H - scrimH, 0, H);
  scrim.addColorStop(0, "rgba(0,0,0,0)");
  scrim.addColorStop(1, "rgba(0,0,0,0.78)");
  ctx.fillStyle = scrim;
  ctx.fillRect(0, H - scrimH, W, scrimH);

  ctx.fillStyle = "#fff";
  ctx.font = `900 ${H * 0.05}px -apple-system, Arial`;
  ctx.fillText(stop.timeRange, pad, H * 0.73);

  let titleSize = H * 0.056;
  ctx.font = `800 ${titleSize}px -apple-system, "Hiragino Sans", Arial`;
  while (ctx.measureText(stop.title).width > W - pad * 2 && titleSize > H * 0.032) {
    titleSize -= 2;
    ctx.font = `800 ${titleSize}px -apple-system, "Hiragino Sans", Arial`;
  }
  wrapText(ctx, stop.title, pad, H * 0.8, W - pad * 2, titleSize * 1.2, 2);

  return finishSlide(canvas);
}

// slide 2: pure text — category, the full description, and any route note
function drawDetailsSlide(stop) {
  const { canvas, ctx, W, H } = newSlideCanvas();
  const { accent, ink, label, dateLabel } = stop.palette;
  const pad = W * 0.09;

  ctx.fillStyle = "#fffdf7";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = accent;
  ctx.fillRect(0, 0, W, H * 0.02);

  ctx.font = `700 ${H * 0.022}px -apple-system, Arial`;
  ctx.fillStyle = accent;
  ctx.fillText(`${label} ・ ${dateLabel}`, pad, H * 0.08);

  const circleR = H * 0.075;
  const circleCx = pad + circleR;
  const circleCy = H * 0.19;
  ctx.beginPath();
  ctx.arc(circleCx, circleCy, circleR, 0, Math.PI * 2);
  ctx.fillStyle = accent;
  ctx.globalAlpha = 0.15;
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.font = `${circleR * 1.2}px -apple-system, Arial`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(stop.emoji, circleCx, circleCy + 2);
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.font = `700 ${H * 0.028}px -apple-system, Arial`;
  ctx.fillStyle = ink;
  ctx.fillText(stop.category, circleCx + circleR + 16, circleCy + 8);

  ctx.font = `600 ${H * 0.026}px -apple-system, Arial`;
  ctx.fillStyle = "rgba(0,0,0,0.5)";
  ctx.fillText(stop.timeRange, circleCx + circleR + 16, circleCy + 8 + H * 0.035);

  ctx.strokeStyle = "rgba(0,0,0,0.12)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(pad, H * 0.3);
  ctx.lineTo(W - pad, H * 0.3);
  ctx.stroke();

  ctx.font = `${H * 0.0265}px -apple-system, "Hiragino Sans", Arial`;
  ctx.fillStyle = ink;
  let y = H * 0.36;
  const lineH = H * 0.0385;
  const linesUsed = wrapText(ctx, stop.fullDescription, pad, y, W - pad * 2, lineH, 13);
  y += linesUsed * lineH + H * 0.035;

  if (stop.altParkingNote) {
    ctx.font = `${H * 0.0215}px -apple-system, Arial`;
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    wrapText(ctx, `※ ${stop.altParkingNote}`, pad, y, W - pad * 2, H * 0.03, 3);
  }

  return finishSlide(canvas);
}

const MAP_SLIDE_HEADING = {
  place: "📍 お店の場所",
  parking: "📍 駐車場",
  "shared-parking": "📍 共通の駐車場",
};

const MAP_BTN_TEXT = {
  place: "📍 お店をGoogleマップで開く",
  parking: "📍 駐車場をGoogleマップで開く",
  "shared-parking": "📍 共通の駐車場を開く",
};

// slide 3 (only when this stop has a map pin): the address, in large
// type, plus a reminder that the map button below the screen opens it
function drawMapSlide(stop) {
  const { canvas, ctx, W, H } = newSlideCanvas();
  const { accent } = stop.palette;
  const pad = W * 0.09;

  ctx.fillStyle = accent;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.font = `700 ${H * 0.03}px -apple-system, Arial`;
  ctx.fillText(MAP_SLIDE_HEADING[stop.mapKind] || "📍 地図", pad, H * 0.16);

  ctx.fillStyle = "#fff";
  ctx.font = `800 ${H * 0.032}px -apple-system, "Hiragino Sans", Arial`;
  let y = H * 0.24;
  const labelLines = wrapText(ctx, stop.mapLabel || "", pad, y, W - pad * 2, H * 0.045, 3);
  y += labelLines * H * 0.045 + H * 0.02;

  ctx.font = `${H * 0.03}px -apple-system, Arial`;
  ctx.fillStyle = "rgba(255,255,255,0.92)";
  const addrLines = wrapText(ctx, stop.mapAddress, pad, y, W - pad * 2, H * 0.042, 4);
  y += addrLines * H * 0.042 + H * 0.03;

  if (stop.mapKind === "shared-parking" && stop.sharedNote) {
    ctx.font = `${H * 0.024}px -apple-system, Arial`;
    ctx.fillStyle = "rgba(255,255,255,0.78)";
    wrapText(ctx, `※ ${stop.sharedNote}`, pad, y, W - pad * 2, H * 0.034, 3);
  }

  ctx.font = `${H * 0.022}px -apple-system, Arial`;
  ctx.fillStyle = "rgba(255,255,255,0.65)";
  ctx.fillText("↓ 画面下のボタンから地図を開けます", pad, H * 0.94);

  return finishSlide(canvas);
}

function slidesFor(stop) {
  const slides = [drawCoverSlide(stop), drawDetailsSlide(stop)];
  if (stop.mapAddress) slides.push(drawMapSlide(stop));
  return slides;
}

function buildStopDeck(stop) {
  disposeSlides();
  let cursorX = 0;
  slidesFor(stop).forEach((texture) => {
    const mat = new THREE.MeshBasicMaterial({ map: texture, clippingPlanes: clipPlanes });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(SLIDE_W, SLIDE_H), mat);
    const centerX = cursorX + SLIDE_W / 2;
    mesh.position.set(centerX, TOP_Y - SLIDE_H / 2, 0);
    mesh.userData.centerX = centerX;
    reel.add(mesh);
    slideMeshes.push(mesh);
    cursorX += SLIDE_W + GALLERY_GAP;
  });
}

const caseStudyEl = document.getElementById("case-study");
const caseTitleEl = document.getElementById("caseTitle");
const caseTagsEl = document.getElementById("caseTags");
const caseMapBtn = document.getElementById("caseMapBtn");
const closeCaseStudyBtn = document.getElementById("closeCaseStudy");
const casePrevBtn = document.getElementById("casePrev");
const caseNextBtn = document.getElementById("caseNext");
const sceneFade = document.getElementById("scene-fade");
const hud = document.getElementById("hud");
const plainSummaryBtn = document.getElementById("openPlainSummary");
const plainSummaryEl = document.getElementById("plain-summary");
const closePlainSummaryBtn = document.getElementById("closePlainSummary");

plainSummaryBtn.addEventListener("click", () => plainSummaryEl.classList.remove("hidden"));
closePlainSummaryBtn.addEventListener("click", () => plainSummaryEl.classList.add("hidden"));

let inRoom = false;
let preRoomCameraPos = null;
let activeSlideIndex = 0;
let reelTargetX = 0;
const ROOM_CAMERA_DISTANCE = 7.4;
// kept low so the visible window extends well below the slide's own bottom
// edge — otherwise the floating map button overlaps the slide's own text
const GALLERY_LOOK_OFFSET_Y = 0.35;
const ROOM_ENTRY_LOCAL = new THREE.Vector3(0, GALLERY_LOOK_OFFSET_Y, ROOM_CAMERA_DISTANCE);
const roomWorldCenter = new THREE.Vector3(0, GALLERY_LOOK_OFFSET_Y, 0).add(ROOM_POSITION);

function setActiveSlide(index) {
  activeSlideIndex = THREE.MathUtils.clamp(index, 0, slideMeshes.length - 1);
  reelTargetX = -slideMeshes[activeSlideIndex].userData.centerX;
}

function flashTransition(callback) {
  sceneFade.classList.add("active");
  setTimeout(() => {
    callback();
    requestAnimationFrame(() => sceneFade.classList.remove("active"));
  }, 260);
}

function openStopDeck(stop) {
  preRoomCameraPos = camera.position.clone();
  flashTransition(() => {
    buildStopDeck(stop);
    setActiveSlide(0);
    reel.position.x = reelTargetX;
    rackGroup.visible = false;
    floor.visible = false;
    roomGroup.visible = true;
    inRoom = true;
    controls.enabled = false;
    camera.position.copy(ROOM_ENTRY_LOCAL).add(ROOM_POSITION);
    camera.lookAt(roomWorldCenter);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    caseStudyEl.classList.remove("day1", "day2");
    caseStudyEl.classList.add(stop.day === 1 ? "day1" : "day2");
    caseTitleEl.textContent = `${stop.emoji} ${stop.title}`;
    caseTagsEl.textContent = `${stop.palette.label} ・ ${stop.palette.dateLabel} ・ ${stop.timeRange}`;
    if (stop.mapAddress) {
      caseMapBtn.href = mapsUrl(stop.mapAddress);
      caseMapBtn.textContent = MAP_BTN_TEXT[stop.mapKind] || "📍 Googleマップで開く";
      caseMapBtn.classList.remove("hidden");
    } else {
      caseMapBtn.classList.add("hidden");
    }

    caseStudyEl.classList.remove("hidden");
    hud.classList.add("hidden");
    plainSummaryBtn.classList.add("hidden");
    scene.background = new THREE.Color(0xffffff);
  });
}

function closeStopDeck() {
  flashTransition(() => {
    roomGroup.visible = false;
    inRoom = false;
    rackGroup.visible = true;
    floor.visible = true;
    controls.enabled = true;
    scene.background = new THREE.Color(0xf7f4ec);
    if (preRoomCameraPos) {
      camera.position.copy(preRoomCameraPos);
      preRoomCameraPos = null;
    }
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    caseStudyEl.classList.add("hidden");
    hud.classList.remove("hidden");
    plainSummaryBtn.classList.remove("hidden");
    scheduleResume(800);
  });
}

closeCaseStudyBtn.addEventListener("click", closeStopDeck);
casePrevBtn.addEventListener("click", () => setActiveSlide(activeSlideIndex - 1));
caseNextBtn.addEventListener("click", () => setActiveSlide(activeSlideIndex + 1));

/* ---------------------------------------------------------------- */
/* Animate                                                            */
/* ---------------------------------------------------------------- */

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const t = clock.getElapsedTime();

  if (inRoom) {
    reel.position.x += (reelTargetX - reel.position.x) * 0.12;
    if (Math.abs(reelTargetX - reel.position.x) < 0.001) reel.position.x = reelTargetX;
    composer.render();
  } else {
    cardGroups.forEach(({ holder, baseRotZ, phase }) => {
      holder.rotation.z = baseRotZ + Math.sin(t * 0.6 + phase) * 0.012;
    });
    controls.update();
    renderer.render(scene, camera);
  }
}

window.addEventListener("resize", () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
});

const loading = document.getElementById("loading");
requestAnimationFrame(() => {
  loading.classList.add("hidden");
});

animate();
