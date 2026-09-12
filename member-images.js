/**
 * member-images.js — Inline SVG avatar placeholders & demo member data
 * No external API dependency — avatars are self-contained SVG data URIs
 */

// Generate a monochrome SVG data-URI avatar from initials
function makeAvatarSVG(initials, bg) {
  bg = bg || '#1a1a1a';
  var fg = '#d1d1d1';
  var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">' +
    '<rect fill="' + bg + '" width="200" height="200"/>' +
    '<text x="100" y="112" text-anchor="middle" fill="' + fg + '" font-family="Orbitron,monospace" font-size="64" font-weight="700">' + initials + '</text>' +
    '</svg>';
  return 'data:image/svg+xml,' + encodeURIComponent(svg);
}

var MEMBER_IMAGES = [
  makeAvatarSVG('ST'),   // STEPTEENOI
  makeAvatarSVG('K'),    // KORN
  makeAvatarSVG('A'),    // ART
  makeAvatarSVG('M'),    // MAY
  makeAvatarSVG('N'),    // NINE
  makeAvatarSVG('R'),    // RIN
  makeAvatarSVG('B'),    // BOY
  makeAvatarSVG('F'),    // FAH
  makeAvatarSVG('P'),    // PEA
  makeAvatarSVG('NM'),   // NAM
  makeAvatarSVG('PK'),   // PAKE
  makeAvatarSVG('MX'),   // MAX
  makeAvatarSVG('PN'),   // PUN
  makeAvatarSVG('TG'),   // TIGER
  makeAvatarSVG('W')     // WIN
];

// Demo member data — used when Firebase has no data
var DEMO_MEMBERS = [
  { id: 'demo1', name: 'STEPTEENOI', role: 'owner', facebook: 'StepTeenOiRP', image: MEMBER_IMAGES[0], desc: 'ผู้ก่อตั้ง STEPTEENOI' },
  { id: 'demo2', name: 'KORN', role: 'core', facebook: 'korn.stt', image: MEMBER_IMAGES[1], desc: 'LEADER' },
  { id: 'demo3', name: 'ART', role: 'core', facebook: 'art.stt', image: MEMBER_IMAGES[2], desc: 'LEADER' },
  { id: 'demo4', name: 'MAY', role: 'member', facebook: '', image: MEMBER_IMAGES[3], desc: '' },
  { id: 'demo5', name: 'NINE', role: 'member', facebook: '', image: MEMBER_IMAGES[4], desc: '' },
  { id: 'demo6', name: 'RIN', role: 'member', facebook: '', image: MEMBER_IMAGES[5], desc: '' },
  { id: 'demo7', name: 'BOY', role: 'member', facebook: '', image: MEMBER_IMAGES[6], desc: '' },
  { id: 'demo8', name: 'FAH', role: 'member', facebook: '', image: MEMBER_IMAGES[7], desc: '' },
  { id: 'demo9', name: 'PEA', role: 'member', facebook: '', image: MEMBER_IMAGES[8], desc: '' },
  { id: 'demo10', name: 'NAM', role: 'member', facebook: '', image: MEMBER_IMAGES[9], desc: '' },
  { id: 'demo11', name: 'PAKE', role: 'member', facebook: '', image: MEMBER_IMAGES[10], desc: '' },
  { id: 'demo12', name: 'MAX', role: 'member', facebook: '', image: MEMBER_IMAGES[11], desc: '' },
  { id: 'demo13', name: 'PUN', role: 'member', facebook: '', image: MEMBER_IMAGES[12], desc: '' },
  { id: 'demo14', name: 'TIGER', role: 'member', facebook: '', image: MEMBER_IMAGES[13], desc: '' },
  { id: 'demo15', name: 'WIN', role: 'member', facebook: '', image: MEMBER_IMAGES[14], desc: '' }
];
