var sh=Object.defineProperty;var rh=(i,t,e)=>t in i?sh(i,t,{enumerable:!0,configurable:!0,writable:!0,value:e}):i[t]=e;var Mo=(i,t,e)=>rh(i,typeof t!="symbol"?t+"":t,e);(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const s of document.querySelectorAll('link[rel="modulepreload"]'))n(s);new MutationObserver(s=>{for(const r of s)if(r.type==="childList")for(const o of r.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&n(o)}).observe(document,{childList:!0,subtree:!0});function e(s){const r={};return s.integrity&&(r.integrity=s.integrity),s.referrerPolicy&&(r.referrerPolicy=s.referrerPolicy),s.crossOrigin==="use-credentials"?r.credentials="include":s.crossOrigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function n(s){if(s.ep)return;s.ep=!0;const r=e(s);fetch(s.href,r)}})();function An(){}function lu(i){return i()}function Za(){return Object.create(null)}function Li(i){i.forEach(lu)}function cu(i){return typeof i=="function"}function za(i,t){return i!=i?t==t:i!==t||i&&typeof i=="object"||typeof i=="function"}function oh(i){return Object.keys(i).length===0}function uu(i,...t){if(i==null){for(const n of t)n(void 0);return An}const e=i.subscribe(...t);return e.unsubscribe?()=>e.unsubscribe():e}function Ln(i){let t;return uu(i,e=>t=e)(),t}function Ke(i,t,e){i.$$.on_destroy.push(uu(t,e))}function $(i,t){i.appendChild(t)}function un(i,t,e){i.insertBefore(t,e||null)}function Ze(i){i.parentNode&&i.parentNode.removeChild(i)}function ah(i,t){for(let e=0;e<i.length;e+=1)i[e]&&i[e].d(t)}function bt(i){return document.createElement(i)}function Nt(i){return document.createTextNode(i)}function Jt(){return Nt(" ")}function xe(i,t,e,n){return i.addEventListener(t,e,n),()=>i.removeEventListener(t,e,n)}function dt(i,t,e){e==null?i.removeAttribute(t):i.getAttribute(t)!==e&&i.setAttribute(t,e)}function ei(i){return i===""?null:+i}function lh(i){return Array.from(i.childNodes)}function De(i,t){t=""+t,i.data!==t&&(i.data=t)}function Wn(i,t){i.value=t??""}function ke(i,t,e){i.classList.toggle(t,!!e)}let Ks;function Ws(i){Ks=i}function hu(){if(!Ks)throw new Error("Function called outside component initialization");return Ks}function ch(i){hu().$$.on_mount.push(i)}function uh(i){hu().$$.on_destroy.push(i)}const us=[],$r=[];let ds=[];const Ja=[],hh=Promise.resolve();let _a=!1;function fh(){_a||(_a=!0,hh.then(fu))}function xa(i){ds.push(i)}const So=new Set;let Ui=0;function fu(){if(Ui!==0)return;const i=Ks;do{try{for(;Ui<us.length;){const t=us[Ui];Ui++,Ws(t),dh(t.$$)}}catch(t){throw us.length=0,Ui=0,t}for(Ws(null),us.length=0,Ui=0;$r.length;)$r.pop()();for(let t=0;t<ds.length;t+=1){const e=ds[t];So.has(e)||(So.add(e),e())}ds.length=0}while(us.length);for(;Ja.length;)Ja.pop()();_a=!1,So.clear(),Ws(i)}function dh(i){if(i.fragment!==null){i.update(),Li(i.before_update);const t=i.dirty;i.dirty=[-1],i.fragment&&i.fragment.p(i.ctx,t),i.after_update.forEach(xa)}}function ph(i){const t=[],e=[];ds.forEach(n=>i.indexOf(n)===-1?t.push(n):e.push(n)),e.forEach(n=>n()),ds=t}const Gr=new Set;let bi;function mh(){bi={r:0,c:[],p:bi}}function gh(){bi.r||Li(bi.c),bi=bi.p}function ps(i,t){i&&i.i&&(Gr.delete(i),i.i(t))}function va(i,t,e,n){if(i&&i.o){if(Gr.has(i))return;Gr.add(i),bi.c.push(()=>{Gr.delete(i),n&&(e&&i.d(1),n())}),i.o(t)}else n&&n()}function Zr(i){return(i==null?void 0:i.length)!==void 0?i:Array.from(i)}function _h(i,t){i.d(1),t.delete(i.key)}function xh(i,t,e,n,s,r,o,a,l,c,h,f){let u=i.length,d=r.length,g=u;const _={};for(;g--;)_[i[g].key]=g;const m=[],p=new Map,M=new Map,x=[];for(g=d;g--;){const S=f(s,r,g),P=e(S);let T=o.get(P);T?x.push(()=>T.p(S,t)):(T=c(P,S),T.c()),p.set(P,m[g]=T),P in _&&M.set(P,Math.abs(g-_[P]))}const E=new Set,A=new Set;function b(S){ps(S,1),S.m(a,h),o.set(S.key,S),h=S.first,d--}for(;u&&d;){const S=m[d-1],P=i[u-1],T=S.key,v=P.key;S===P?(h=S.first,u--,d--):p.has(v)?!o.has(T)||E.has(T)?b(S):A.has(v)?u--:M.get(T)>M.get(v)?(A.add(T),b(S)):(E.add(v),u--):(l(P,o),u--)}for(;u--;){const S=i[u];p.has(S.key)||l(S,o)}for(;d;)b(m[d-1]);return Li(x),m}function vh(i){i&&i.c()}function du(i,t,e){const{fragment:n,after_update:s}=i.$$;n&&n.m(t,e),xa(()=>{const r=i.$$.on_mount.map(lu).filter(cu);i.$$.on_destroy?i.$$.on_destroy.push(...r):Li(r),i.$$.on_mount=[]}),s.forEach(xa)}function pu(i,t){const e=i.$$;e.fragment!==null&&(ph(e.after_update),Li(e.on_destroy),e.fragment&&e.fragment.d(t),e.on_destroy=e.fragment=null,e.ctx=[])}function Mh(i,t){i.$$.dirty[0]===-1&&(us.push(i),fh(),i.$$.dirty.fill(0)),i.$$.dirty[t/31|0]|=1<<t%31}function mu(i,t,e,n,s,r,o=null,a=[-1]){const l=Ks;Ws(i);const c=i.$$={fragment:null,ctx:[],props:r,update:An,not_equal:s,bound:Za(),on_mount:[],on_destroy:[],on_disconnect:[],before_update:[],after_update:[],context:new Map(t.context||(l?l.$$.context:[])),callbacks:Za(),dirty:a,skip_bound:!1,root:t.target||l.$$.root};o&&o(c.root);let h=!1;if(c.ctx=e?e(i,t.props||{},(f,u,...d)=>{const g=d.length?d[0]:u;return c.ctx&&s(c.ctx[f],c.ctx[f]=g)&&(!c.skip_bound&&c.bound[f]&&c.bound[f](g),h&&Mh(i,f)),u}):[],c.update(),h=!0,Li(c.before_update),c.fragment=n?n(c.ctx):!1,t.target){if(t.hydrate){const f=lh(t.target);c.fragment&&c.fragment.l(f),f.forEach(Ze)}else c.fragment&&c.fragment.c();t.intro&&ps(i.$$.fragment),du(i,t.target,t.anchor),fu()}Ws(l)}class gu{constructor(){Mo(this,"$$");Mo(this,"$$set")}$destroy(){pu(this,1),this.$destroy=An}$on(t,e){if(!cu(e))return An;const n=this.$$.callbacks[t]||(this.$$.callbacks[t]=[]);return n.push(e),()=>{const s=n.indexOf(e);s!==-1&&n.splice(s,1)}}$set(t){this.$$set&&!oh(t)&&(this.$$.skip_bound=!0,this.$$set(t),this.$$.skip_bound=!1)}}const Sh="4";typeof window<"u"&&(window.__svelte||(window.__svelte={v:new Set})).v.add(Sh);/**
 * @license
 * Copyright 2010-2024 Three.js Authors
 * SPDX-License-Identifier: MIT
 */const Ba="165",Ii={ROTATE:0,DOLLY:1,PAN:2},Ni={ROTATE:0,PAN:1,DOLLY_PAN:2,DOLLY_ROTATE:3},yh=0,Qa=1,Eh=2,_u=1,Th=2,On=3,wn=0,Fe=1,En=2,oi=0,ms=1,tl=2,el=3,nl=4,bh=5,Ei=100,Ah=101,wh=102,Rh=103,Ch=104,Ph=200,Lh=201,Dh=202,Uh=203,Ma=204,Sa=205,Ih=206,Nh=207,Fh=208,Oh=209,zh=210,Bh=211,kh=212,Hh=213,Gh=214,Vh=0,Wh=1,Xh=2,Jr=3,qh=4,Yh=5,jh=6,Kh=7,ka=0,$h=1,Zh=2,ai=0,Jh=1,Qh=2,tf=3,ef=4,nf=5,sf=6,rf=7,xu=300,xs=301,vs=302,ya=303,Ea=304,uo=306,Ta=1e3,Ai=1001,ba=1002,rn=1003,of=1004,er=1005,xn=1006,yo=1007,wi=1008,li=1009,af=1010,lf=1011,Qr=1012,vu=1013,Ms=1014,ni=1015,ho=1016,Mu=1017,Su=1018,Ss=1020,cf=35902,uf=1021,hf=1022,bn=1023,ff=1024,df=1025,gs=1026,ys=1027,pf=1028,yu=1029,mf=1030,Eu=1031,Tu=1033,Eo=33776,To=33777,bo=33778,Ao=33779,il=35840,sl=35841,rl=35842,ol=35843,al=36196,ll=37492,cl=37496,ul=37808,hl=37809,fl=37810,dl=37811,pl=37812,ml=37813,gl=37814,_l=37815,xl=37816,vl=37817,Ml=37818,Sl=37819,yl=37820,El=37821,wo=36492,Tl=36494,bl=36495,gf=36283,Al=36284,wl=36285,Rl=36286,_f=3200,xf=3201,bu=0,vf=1,ti="",Sn="srgb",hi="srgb-linear",Ha="display-p3",fo="display-p3-linear",to="linear",oe="srgb",eo="rec709",no="p3",Fi=7680,Cl=519,Mf=512,Sf=513,yf=514,Au=515,Ef=516,Tf=517,bf=518,Af=519,Pl=35044,Ll="300 es",kn=2e3,io=2001;class Di{addEventListener(t,e){this._listeners===void 0&&(this._listeners={});const n=this._listeners;n[t]===void 0&&(n[t]=[]),n[t].indexOf(e)===-1&&n[t].push(e)}hasEventListener(t,e){if(this._listeners===void 0)return!1;const n=this._listeners;return n[t]!==void 0&&n[t].indexOf(e)!==-1}removeEventListener(t,e){if(this._listeners===void 0)return;const s=this._listeners[t];if(s!==void 0){const r=s.indexOf(e);r!==-1&&s.splice(r,1)}}dispatchEvent(t){if(this._listeners===void 0)return;const n=this._listeners[t.type];if(n!==void 0){t.target=this;const s=n.slice(0);for(let r=0,o=s.length;r<o;r++)s[r].call(this,t);t.target=null}}}const Ce=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"],Vr=Math.PI/180,Aa=180/Math.PI;function $s(){const i=Math.random()*4294967295|0,t=Math.random()*4294967295|0,e=Math.random()*4294967295|0,n=Math.random()*4294967295|0;return(Ce[i&255]+Ce[i>>8&255]+Ce[i>>16&255]+Ce[i>>24&255]+"-"+Ce[t&255]+Ce[t>>8&255]+"-"+Ce[t>>16&15|64]+Ce[t>>24&255]+"-"+Ce[e&63|128]+Ce[e>>8&255]+"-"+Ce[e>>16&255]+Ce[e>>24&255]+Ce[n&255]+Ce[n>>8&255]+Ce[n>>16&255]+Ce[n>>24&255]).toLowerCase()}function Le(i,t,e){return Math.max(t,Math.min(e,i))}function wf(i,t){return(i%t+t)%t}function Ro(i,t,e){return(1-e)*i+e*t}function ws(i,t){switch(t.constructor){case Float32Array:return i;case Uint32Array:return i/4294967295;case Uint16Array:return i/65535;case Uint8Array:return i/255;case Int32Array:return Math.max(i/2147483647,-1);case Int16Array:return Math.max(i/32767,-1);case Int8Array:return Math.max(i/127,-1);default:throw new Error("Invalid component type.")}}function Be(i,t){switch(t.constructor){case Float32Array:return i;case Uint32Array:return Math.round(i*4294967295);case Uint16Array:return Math.round(i*65535);case Uint8Array:return Math.round(i*255);case Int32Array:return Math.round(i*2147483647);case Int16Array:return Math.round(i*32767);case Int8Array:return Math.round(i*127);default:throw new Error("Invalid component type.")}}const Rf={DEG2RAD:Vr};class At{constructor(t=0,e=0){At.prototype.isVector2=!0,this.x=t,this.y=e}get width(){return this.x}set width(t){this.x=t}get height(){return this.y}set height(t){this.y=t}set(t,e){return this.x=t,this.y=e,this}setScalar(t){return this.x=t,this.y=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;default:throw new Error("index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;default:throw new Error("index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y)}copy(t){return this.x=t.x,this.y=t.y,this}add(t){return this.x+=t.x,this.y+=t.y,this}addScalar(t){return this.x+=t,this.y+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this}subScalar(t){return this.x-=t,this.y-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this}multiply(t){return this.x*=t.x,this.y*=t.y,this}multiplyScalar(t){return this.x*=t,this.y*=t,this}divide(t){return this.x/=t.x,this.y/=t.y,this}divideScalar(t){return this.multiplyScalar(1/t)}applyMatrix3(t){const e=this.x,n=this.y,s=t.elements;return this.x=s[0]*e+s[3]*n+s[6],this.y=s[1]*e+s[4]*n+s[7],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this}clamp(t,e){return this.x=Math.max(t.x,Math.min(e.x,this.x)),this.y=Math.max(t.y,Math.min(e.y,this.y)),this}clampScalar(t,e){return this.x=Math.max(t,Math.min(e,this.x)),this.y=Math.max(t,Math.min(e,this.y)),this}clampLength(t,e){const n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(t,Math.min(e,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(t){return this.x*t.x+this.y*t.y}cross(t){return this.x*t.y-this.y*t.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(t){const e=Math.sqrt(this.lengthSq()*t.lengthSq());if(e===0)return Math.PI/2;const n=this.dot(t)/e;return Math.acos(Le(n,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){const e=this.x-t.x,n=this.y-t.y;return e*e+n*n}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this}equals(t){return t.x===this.x&&t.y===this.y}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this}rotateAround(t,e){const n=Math.cos(e),s=Math.sin(e),r=this.x-t.x,o=this.y-t.y;return this.x=r*n-o*s+t.x,this.y=r*s+o*n+t.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}}class Vt{constructor(t,e,n,s,r,o,a,l,c){Vt.prototype.isMatrix3=!0,this.elements=[1,0,0,0,1,0,0,0,1],t!==void 0&&this.set(t,e,n,s,r,o,a,l,c)}set(t,e,n,s,r,o,a,l,c){const h=this.elements;return h[0]=t,h[1]=s,h[2]=a,h[3]=e,h[4]=r,h[5]=l,h[6]=n,h[7]=o,h[8]=c,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(t){const e=this.elements,n=t.elements;return e[0]=n[0],e[1]=n[1],e[2]=n[2],e[3]=n[3],e[4]=n[4],e[5]=n[5],e[6]=n[6],e[7]=n[7],e[8]=n[8],this}extractBasis(t,e,n){return t.setFromMatrix3Column(this,0),e.setFromMatrix3Column(this,1),n.setFromMatrix3Column(this,2),this}setFromMatrix4(t){const e=t.elements;return this.set(e[0],e[4],e[8],e[1],e[5],e[9],e[2],e[6],e[10]),this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,e){const n=t.elements,s=e.elements,r=this.elements,o=n[0],a=n[3],l=n[6],c=n[1],h=n[4],f=n[7],u=n[2],d=n[5],g=n[8],_=s[0],m=s[3],p=s[6],M=s[1],x=s[4],E=s[7],A=s[2],b=s[5],S=s[8];return r[0]=o*_+a*M+l*A,r[3]=o*m+a*x+l*b,r[6]=o*p+a*E+l*S,r[1]=c*_+h*M+f*A,r[4]=c*m+h*x+f*b,r[7]=c*p+h*E+f*S,r[2]=u*_+d*M+g*A,r[5]=u*m+d*x+g*b,r[8]=u*p+d*E+g*S,this}multiplyScalar(t){const e=this.elements;return e[0]*=t,e[3]*=t,e[6]*=t,e[1]*=t,e[4]*=t,e[7]*=t,e[2]*=t,e[5]*=t,e[8]*=t,this}determinant(){const t=this.elements,e=t[0],n=t[1],s=t[2],r=t[3],o=t[4],a=t[5],l=t[6],c=t[7],h=t[8];return e*o*h-e*a*c-n*r*h+n*a*l+s*r*c-s*o*l}invert(){const t=this.elements,e=t[0],n=t[1],s=t[2],r=t[3],o=t[4],a=t[5],l=t[6],c=t[7],h=t[8],f=h*o-a*c,u=a*l-h*r,d=c*r-o*l,g=e*f+n*u+s*d;if(g===0)return this.set(0,0,0,0,0,0,0,0,0);const _=1/g;return t[0]=f*_,t[1]=(s*c-h*n)*_,t[2]=(a*n-s*o)*_,t[3]=u*_,t[4]=(h*e-s*l)*_,t[5]=(s*r-a*e)*_,t[6]=d*_,t[7]=(n*l-c*e)*_,t[8]=(o*e-n*r)*_,this}transpose(){let t;const e=this.elements;return t=e[1],e[1]=e[3],e[3]=t,t=e[2],e[2]=e[6],e[6]=t,t=e[5],e[5]=e[7],e[7]=t,this}getNormalMatrix(t){return this.setFromMatrix4(t).invert().transpose()}transposeIntoArray(t){const e=this.elements;return t[0]=e[0],t[1]=e[3],t[2]=e[6],t[3]=e[1],t[4]=e[4],t[5]=e[7],t[6]=e[2],t[7]=e[5],t[8]=e[8],this}setUvTransform(t,e,n,s,r,o,a){const l=Math.cos(r),c=Math.sin(r);return this.set(n*l,n*c,-n*(l*o+c*a)+o+t,-s*c,s*l,-s*(-c*o+l*a)+a+e,0,0,1),this}scale(t,e){return this.premultiply(Co.makeScale(t,e)),this}rotate(t){return this.premultiply(Co.makeRotation(-t)),this}translate(t,e){return this.premultiply(Co.makeTranslation(t,e)),this}makeTranslation(t,e){return t.isVector2?this.set(1,0,t.x,0,1,t.y,0,0,1):this.set(1,0,t,0,1,e,0,0,1),this}makeRotation(t){const e=Math.cos(t),n=Math.sin(t);return this.set(e,-n,0,n,e,0,0,0,1),this}makeScale(t,e){return this.set(t,0,0,0,e,0,0,0,1),this}equals(t){const e=this.elements,n=t.elements;for(let s=0;s<9;s++)if(e[s]!==n[s])return!1;return!0}fromArray(t,e=0){for(let n=0;n<9;n++)this.elements[n]=t[n+e];return this}toArray(t=[],e=0){const n=this.elements;return t[e]=n[0],t[e+1]=n[1],t[e+2]=n[2],t[e+3]=n[3],t[e+4]=n[4],t[e+5]=n[5],t[e+6]=n[6],t[e+7]=n[7],t[e+8]=n[8],t}clone(){return new this.constructor().fromArray(this.elements)}}const Co=new Vt;function wu(i){for(let t=i.length-1;t>=0;--t)if(i[t]>=65535)return!0;return!1}function so(i){return document.createElementNS("http://www.w3.org/1999/xhtml",i)}function Cf(){const i=so("canvas");return i.style.display="block",i}const Dl={};function Ru(i){i in Dl||(Dl[i]=!0,console.warn(i))}function Pf(i,t,e){return new Promise(function(n,s){function r(){switch(i.clientWaitSync(t,i.SYNC_FLUSH_COMMANDS_BIT,0)){case i.WAIT_FAILED:s();break;case i.TIMEOUT_EXPIRED:setTimeout(r,e);break;default:n()}}setTimeout(r,e)})}const Ul=new Vt().set(.8224621,.177538,0,.0331941,.9668058,0,.0170827,.0723974,.9105199),Il=new Vt().set(1.2249401,-.2249404,0,-.0420569,1.0420571,0,-.0196376,-.0786361,1.0982735),nr={[hi]:{transfer:to,primaries:eo,toReference:i=>i,fromReference:i=>i},[Sn]:{transfer:oe,primaries:eo,toReference:i=>i.convertSRGBToLinear(),fromReference:i=>i.convertLinearToSRGB()},[fo]:{transfer:to,primaries:no,toReference:i=>i.applyMatrix3(Il),fromReference:i=>i.applyMatrix3(Ul)},[Ha]:{transfer:oe,primaries:no,toReference:i=>i.convertSRGBToLinear().applyMatrix3(Il),fromReference:i=>i.applyMatrix3(Ul).convertLinearToSRGB()}},Lf=new Set([hi,fo]),ne={enabled:!0,_workingColorSpace:hi,get workingColorSpace(){return this._workingColorSpace},set workingColorSpace(i){if(!Lf.has(i))throw new Error(`Unsupported working color space, "${i}".`);this._workingColorSpace=i},convert:function(i,t,e){if(this.enabled===!1||t===e||!t||!e)return i;const n=nr[t].toReference,s=nr[e].fromReference;return s(n(i))},fromWorkingColorSpace:function(i,t){return this.convert(i,this._workingColorSpace,t)},toWorkingColorSpace:function(i,t){return this.convert(i,t,this._workingColorSpace)},getPrimaries:function(i){return nr[i].primaries},getTransfer:function(i){return i===ti?to:nr[i].transfer}};function _s(i){return i<.04045?i*.0773993808:Math.pow(i*.9478672986+.0521327014,2.4)}function Po(i){return i<.0031308?i*12.92:1.055*Math.pow(i,.41666)-.055}let Oi;class Df{static getDataURL(t){if(/^data:/i.test(t.src)||typeof HTMLCanvasElement>"u")return t.src;let e;if(t instanceof HTMLCanvasElement)e=t;else{Oi===void 0&&(Oi=so("canvas")),Oi.width=t.width,Oi.height=t.height;const n=Oi.getContext("2d");t instanceof ImageData?n.putImageData(t,0,0):n.drawImage(t,0,0,t.width,t.height),e=Oi}return e.width>2048||e.height>2048?(console.warn("THREE.ImageUtils.getDataURL: Image converted to jpg for performance reasons",t),e.toDataURL("image/jpeg",.6)):e.toDataURL("image/png")}static sRGBToLinear(t){if(typeof HTMLImageElement<"u"&&t instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&t instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&t instanceof ImageBitmap){const e=so("canvas");e.width=t.width,e.height=t.height;const n=e.getContext("2d");n.drawImage(t,0,0,t.width,t.height);const s=n.getImageData(0,0,t.width,t.height),r=s.data;for(let o=0;o<r.length;o++)r[o]=_s(r[o]/255)*255;return n.putImageData(s,0,0),e}else if(t.data){const e=t.data.slice(0);for(let n=0;n<e.length;n++)e instanceof Uint8Array||e instanceof Uint8ClampedArray?e[n]=Math.floor(_s(e[n]/255)*255):e[n]=_s(e[n]);return{data:e,width:t.width,height:t.height}}else return console.warn("THREE.ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),t}}let Uf=0;class Cu{constructor(t=null){this.isSource=!0,Object.defineProperty(this,"id",{value:Uf++}),this.uuid=$s(),this.data=t,this.dataReady=!0,this.version=0}set needsUpdate(t){t===!0&&this.version++}toJSON(t){const e=t===void 0||typeof t=="string";if(!e&&t.images[this.uuid]!==void 0)return t.images[this.uuid];const n={uuid:this.uuid,url:""},s=this.data;if(s!==null){let r;if(Array.isArray(s)){r=[];for(let o=0,a=s.length;o<a;o++)s[o].isDataTexture?r.push(Lo(s[o].image)):r.push(Lo(s[o]))}else r=Lo(s);n.url=r}return e||(t.images[this.uuid]=n),n}}function Lo(i){return typeof HTMLImageElement<"u"&&i instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&i instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&i instanceof ImageBitmap?Df.getDataURL(i):i.data?{data:Array.from(i.data),width:i.width,height:i.height,type:i.data.constructor.name}:(console.warn("THREE.Texture: Unable to serialize Texture."),{})}let If=0;class Ge extends Di{constructor(t=Ge.DEFAULT_IMAGE,e=Ge.DEFAULT_MAPPING,n=Ai,s=Ai,r=xn,o=wi,a=bn,l=li,c=Ge.DEFAULT_ANISOTROPY,h=ti){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:If++}),this.uuid=$s(),this.name="",this.source=new Cu(t),this.mipmaps=[],this.mapping=e,this.channel=0,this.wrapS=n,this.wrapT=s,this.magFilter=r,this.minFilter=o,this.anisotropy=c,this.format=a,this.internalFormat=null,this.type=l,this.offset=new At(0,0),this.repeat=new At(1,1),this.center=new At(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new Vt,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=h,this.userData={},this.version=0,this.onUpdate=null,this.isRenderTargetTexture=!1,this.pmremVersion=0}get image(){return this.source.data}set image(t=null){this.source.data=t}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}clone(){return new this.constructor().copy(this)}copy(t){return this.name=t.name,this.source=t.source,this.mipmaps=t.mipmaps.slice(0),this.mapping=t.mapping,this.channel=t.channel,this.wrapS=t.wrapS,this.wrapT=t.wrapT,this.magFilter=t.magFilter,this.minFilter=t.minFilter,this.anisotropy=t.anisotropy,this.format=t.format,this.internalFormat=t.internalFormat,this.type=t.type,this.offset.copy(t.offset),this.repeat.copy(t.repeat),this.center.copy(t.center),this.rotation=t.rotation,this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrix.copy(t.matrix),this.generateMipmaps=t.generateMipmaps,this.premultiplyAlpha=t.premultiplyAlpha,this.flipY=t.flipY,this.unpackAlignment=t.unpackAlignment,this.colorSpace=t.colorSpace,this.userData=JSON.parse(JSON.stringify(t.userData)),this.needsUpdate=!0,this}toJSON(t){const e=t===void 0||typeof t=="string";if(!e&&t.textures[this.uuid]!==void 0)return t.textures[this.uuid];const n={metadata:{version:4.6,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(t).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(n.userData=this.userData),e||(t.textures[this.uuid]=n),n}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(t){if(this.mapping!==xu)return t;if(t.applyMatrix3(this.matrix),t.x<0||t.x>1)switch(this.wrapS){case Ta:t.x=t.x-Math.floor(t.x);break;case Ai:t.x=t.x<0?0:1;break;case ba:Math.abs(Math.floor(t.x)%2)===1?t.x=Math.ceil(t.x)-t.x:t.x=t.x-Math.floor(t.x);break}if(t.y<0||t.y>1)switch(this.wrapT){case Ta:t.y=t.y-Math.floor(t.y);break;case Ai:t.y=t.y<0?0:1;break;case ba:Math.abs(Math.floor(t.y)%2)===1?t.y=Math.ceil(t.y)-t.y:t.y=t.y-Math.floor(t.y);break}return this.flipY&&(t.y=1-t.y),t}set needsUpdate(t){t===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(t){t===!0&&this.pmremVersion++}}Ge.DEFAULT_IMAGE=null;Ge.DEFAULT_MAPPING=xu;Ge.DEFAULT_ANISOTROPY=1;class Ee{constructor(t=0,e=0,n=0,s=1){Ee.prototype.isVector4=!0,this.x=t,this.y=e,this.z=n,this.w=s}get width(){return this.z}set width(t){this.z=t}get height(){return this.w}set height(t){this.w=t}set(t,e,n,s){return this.x=t,this.y=e,this.z=n,this.w=s,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this.w=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setW(t){return this.w=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;case 2:this.z=e;break;case 3:this.w=e;break;default:throw new Error("index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this.w=t.w!==void 0?t.w:1,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this.w+=t.w,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this.w+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this.z=t.z+e.z,this.w=t.w+e.w,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this.z+=t.z*e,this.w+=t.w*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this.w-=t.w,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this.w-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this.z=t.z-e.z,this.w=t.w-e.w,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this.w*=t.w,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this.w*=t,this}applyMatrix4(t){const e=this.x,n=this.y,s=this.z,r=this.w,o=t.elements;return this.x=o[0]*e+o[4]*n+o[8]*s+o[12]*r,this.y=o[1]*e+o[5]*n+o[9]*s+o[13]*r,this.z=o[2]*e+o[6]*n+o[10]*s+o[14]*r,this.w=o[3]*e+o[7]*n+o[11]*s+o[15]*r,this}divideScalar(t){return this.multiplyScalar(1/t)}setAxisAngleFromQuaternion(t){this.w=2*Math.acos(t.w);const e=Math.sqrt(1-t.w*t.w);return e<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=t.x/e,this.y=t.y/e,this.z=t.z/e),this}setAxisAngleFromRotationMatrix(t){let e,n,s,r;const l=t.elements,c=l[0],h=l[4],f=l[8],u=l[1],d=l[5],g=l[9],_=l[2],m=l[6],p=l[10];if(Math.abs(h-u)<.01&&Math.abs(f-_)<.01&&Math.abs(g-m)<.01){if(Math.abs(h+u)<.1&&Math.abs(f+_)<.1&&Math.abs(g+m)<.1&&Math.abs(c+d+p-3)<.1)return this.set(1,0,0,0),this;e=Math.PI;const x=(c+1)/2,E=(d+1)/2,A=(p+1)/2,b=(h+u)/4,S=(f+_)/4,P=(g+m)/4;return x>E&&x>A?x<.01?(n=0,s=.707106781,r=.707106781):(n=Math.sqrt(x),s=b/n,r=S/n):E>A?E<.01?(n=.707106781,s=0,r=.707106781):(s=Math.sqrt(E),n=b/s,r=P/s):A<.01?(n=.707106781,s=.707106781,r=0):(r=Math.sqrt(A),n=S/r,s=P/r),this.set(n,s,r,e),this}let M=Math.sqrt((m-g)*(m-g)+(f-_)*(f-_)+(u-h)*(u-h));return Math.abs(M)<.001&&(M=1),this.x=(m-g)/M,this.y=(f-_)/M,this.z=(u-h)/M,this.w=Math.acos((c+d+p-1)/2),this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this.w=Math.min(this.w,t.w),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this.w=Math.max(this.w,t.w),this}clamp(t,e){return this.x=Math.max(t.x,Math.min(e.x,this.x)),this.y=Math.max(t.y,Math.min(e.y,this.y)),this.z=Math.max(t.z,Math.min(e.z,this.z)),this.w=Math.max(t.w,Math.min(e.w,this.w)),this}clampScalar(t,e){return this.x=Math.max(t,Math.min(e,this.x)),this.y=Math.max(t,Math.min(e,this.y)),this.z=Math.max(t,Math.min(e,this.z)),this.w=Math.max(t,Math.min(e,this.w)),this}clampLength(t,e){const n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(t,Math.min(e,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z+this.w*t.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this.z+=(t.z-this.z)*e,this.w+=(t.w-this.w)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this.z=t.z+(e.z-t.z)*n,this.w=t.w+(e.w-t.w)*n,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z&&t.w===this.w}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this.z=t[e+2],this.w=t[e+3],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t[e+2]=this.z,t[e+3]=this.w,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this.z=t.getZ(e),this.w=t.getW(e),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}}class Nf extends Di{constructor(t=1,e=1,n={}){super(),this.isRenderTarget=!0,this.width=t,this.height=e,this.depth=1,this.scissor=new Ee(0,0,t,e),this.scissorTest=!1,this.viewport=new Ee(0,0,t,e);const s={width:t,height:e,depth:1};n=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:xn,depthBuffer:!0,stencilBuffer:!1,resolveDepthBuffer:!0,resolveStencilBuffer:!0,depthTexture:null,samples:0,count:1},n);const r=new Ge(s,n.mapping,n.wrapS,n.wrapT,n.magFilter,n.minFilter,n.format,n.type,n.anisotropy,n.colorSpace);r.flipY=!1,r.generateMipmaps=n.generateMipmaps,r.internalFormat=n.internalFormat,this.textures=[];const o=n.count;for(let a=0;a<o;a++)this.textures[a]=r.clone(),this.textures[a].isRenderTargetTexture=!0;this.depthBuffer=n.depthBuffer,this.stencilBuffer=n.stencilBuffer,this.resolveDepthBuffer=n.resolveDepthBuffer,this.resolveStencilBuffer=n.resolveStencilBuffer,this.depthTexture=n.depthTexture,this.samples=n.samples}get texture(){return this.textures[0]}set texture(t){this.textures[0]=t}setSize(t,e,n=1){if(this.width!==t||this.height!==e||this.depth!==n){this.width=t,this.height=e,this.depth=n;for(let s=0,r=this.textures.length;s<r;s++)this.textures[s].image.width=t,this.textures[s].image.height=e,this.textures[s].image.depth=n;this.dispose()}this.viewport.set(0,0,t,e),this.scissor.set(0,0,t,e)}clone(){return new this.constructor().copy(this)}copy(t){this.width=t.width,this.height=t.height,this.depth=t.depth,this.scissor.copy(t.scissor),this.scissorTest=t.scissorTest,this.viewport.copy(t.viewport),this.textures.length=0;for(let n=0,s=t.textures.length;n<s;n++)this.textures[n]=t.textures[n].clone(),this.textures[n].isRenderTargetTexture=!0;const e=Object.assign({},t.texture.image);return this.texture.source=new Cu(e),this.depthBuffer=t.depthBuffer,this.stencilBuffer=t.stencilBuffer,this.resolveDepthBuffer=t.resolveDepthBuffer,this.resolveStencilBuffer=t.resolveStencilBuffer,t.depthTexture!==null&&(this.depthTexture=t.depthTexture.clone()),this.samples=t.samples,this}dispose(){this.dispatchEvent({type:"dispose"})}}class Ri extends Nf{constructor(t=1,e=1,n={}){super(t,e,n),this.isWebGLRenderTarget=!0}}class Pu extends Ge{constructor(t=null,e=1,n=1,s=1){super(null),this.isDataArrayTexture=!0,this.image={data:t,width:e,height:n,depth:s},this.magFilter=rn,this.minFilter=rn,this.wrapR=Ai,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}addLayerUpdate(t){this.layerUpdates.add(t)}clearLayerUpdates(){this.layerUpdates.clear()}}class Ff extends Ge{constructor(t=null,e=1,n=1,s=1){super(null),this.isData3DTexture=!0,this.image={data:t,width:e,height:n,depth:s},this.magFilter=rn,this.minFilter=rn,this.wrapR=Ai,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}class Ci{constructor(t=0,e=0,n=0,s=1){this.isQuaternion=!0,this._x=t,this._y=e,this._z=n,this._w=s}static slerpFlat(t,e,n,s,r,o,a){let l=n[s+0],c=n[s+1],h=n[s+2],f=n[s+3];const u=r[o+0],d=r[o+1],g=r[o+2],_=r[o+3];if(a===0){t[e+0]=l,t[e+1]=c,t[e+2]=h,t[e+3]=f;return}if(a===1){t[e+0]=u,t[e+1]=d,t[e+2]=g,t[e+3]=_;return}if(f!==_||l!==u||c!==d||h!==g){let m=1-a;const p=l*u+c*d+h*g+f*_,M=p>=0?1:-1,x=1-p*p;if(x>Number.EPSILON){const A=Math.sqrt(x),b=Math.atan2(A,p*M);m=Math.sin(m*b)/A,a=Math.sin(a*b)/A}const E=a*M;if(l=l*m+u*E,c=c*m+d*E,h=h*m+g*E,f=f*m+_*E,m===1-a){const A=1/Math.sqrt(l*l+c*c+h*h+f*f);l*=A,c*=A,h*=A,f*=A}}t[e]=l,t[e+1]=c,t[e+2]=h,t[e+3]=f}static multiplyQuaternionsFlat(t,e,n,s,r,o){const a=n[s],l=n[s+1],c=n[s+2],h=n[s+3],f=r[o],u=r[o+1],d=r[o+2],g=r[o+3];return t[e]=a*g+h*f+l*d-c*u,t[e+1]=l*g+h*u+c*f-a*d,t[e+2]=c*g+h*d+a*u-l*f,t[e+3]=h*g-a*f-l*u-c*d,t}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get w(){return this._w}set w(t){this._w=t,this._onChangeCallback()}set(t,e,n,s){return this._x=t,this._y=e,this._z=n,this._w=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(t){return this._x=t.x,this._y=t.y,this._z=t.z,this._w=t.w,this._onChangeCallback(),this}setFromEuler(t,e=!0){const n=t._x,s=t._y,r=t._z,o=t._order,a=Math.cos,l=Math.sin,c=a(n/2),h=a(s/2),f=a(r/2),u=l(n/2),d=l(s/2),g=l(r/2);switch(o){case"XYZ":this._x=u*h*f+c*d*g,this._y=c*d*f-u*h*g,this._z=c*h*g+u*d*f,this._w=c*h*f-u*d*g;break;case"YXZ":this._x=u*h*f+c*d*g,this._y=c*d*f-u*h*g,this._z=c*h*g-u*d*f,this._w=c*h*f+u*d*g;break;case"ZXY":this._x=u*h*f-c*d*g,this._y=c*d*f+u*h*g,this._z=c*h*g+u*d*f,this._w=c*h*f-u*d*g;break;case"ZYX":this._x=u*h*f-c*d*g,this._y=c*d*f+u*h*g,this._z=c*h*g-u*d*f,this._w=c*h*f+u*d*g;break;case"YZX":this._x=u*h*f+c*d*g,this._y=c*d*f+u*h*g,this._z=c*h*g-u*d*f,this._w=c*h*f-u*d*g;break;case"XZY":this._x=u*h*f-c*d*g,this._y=c*d*f-u*h*g,this._z=c*h*g+u*d*f,this._w=c*h*f+u*d*g;break;default:console.warn("THREE.Quaternion: .setFromEuler() encountered an unknown order: "+o)}return e===!0&&this._onChangeCallback(),this}setFromAxisAngle(t,e){const n=e/2,s=Math.sin(n);return this._x=t.x*s,this._y=t.y*s,this._z=t.z*s,this._w=Math.cos(n),this._onChangeCallback(),this}setFromRotationMatrix(t){const e=t.elements,n=e[0],s=e[4],r=e[8],o=e[1],a=e[5],l=e[9],c=e[2],h=e[6],f=e[10],u=n+a+f;if(u>0){const d=.5/Math.sqrt(u+1);this._w=.25/d,this._x=(h-l)*d,this._y=(r-c)*d,this._z=(o-s)*d}else if(n>a&&n>f){const d=2*Math.sqrt(1+n-a-f);this._w=(h-l)/d,this._x=.25*d,this._y=(s+o)/d,this._z=(r+c)/d}else if(a>f){const d=2*Math.sqrt(1+a-n-f);this._w=(r-c)/d,this._x=(s+o)/d,this._y=.25*d,this._z=(l+h)/d}else{const d=2*Math.sqrt(1+f-n-a);this._w=(o-s)/d,this._x=(r+c)/d,this._y=(l+h)/d,this._z=.25*d}return this._onChangeCallback(),this}setFromUnitVectors(t,e){let n=t.dot(e)+1;return n<Number.EPSILON?(n=0,Math.abs(t.x)>Math.abs(t.z)?(this._x=-t.y,this._y=t.x,this._z=0,this._w=n):(this._x=0,this._y=-t.z,this._z=t.y,this._w=n)):(this._x=t.y*e.z-t.z*e.y,this._y=t.z*e.x-t.x*e.z,this._z=t.x*e.y-t.y*e.x,this._w=n),this.normalize()}angleTo(t){return 2*Math.acos(Math.abs(Le(this.dot(t),-1,1)))}rotateTowards(t,e){const n=this.angleTo(t);if(n===0)return this;const s=Math.min(1,e/n);return this.slerp(t,s),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(t){return this._x*t._x+this._y*t._y+this._z*t._z+this._w*t._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let t=this.length();return t===0?(this._x=0,this._y=0,this._z=0,this._w=1):(t=1/t,this._x=this._x*t,this._y=this._y*t,this._z=this._z*t,this._w=this._w*t),this._onChangeCallback(),this}multiply(t){return this.multiplyQuaternions(this,t)}premultiply(t){return this.multiplyQuaternions(t,this)}multiplyQuaternions(t,e){const n=t._x,s=t._y,r=t._z,o=t._w,a=e._x,l=e._y,c=e._z,h=e._w;return this._x=n*h+o*a+s*c-r*l,this._y=s*h+o*l+r*a-n*c,this._z=r*h+o*c+n*l-s*a,this._w=o*h-n*a-s*l-r*c,this._onChangeCallback(),this}slerp(t,e){if(e===0)return this;if(e===1)return this.copy(t);const n=this._x,s=this._y,r=this._z,o=this._w;let a=o*t._w+n*t._x+s*t._y+r*t._z;if(a<0?(this._w=-t._w,this._x=-t._x,this._y=-t._y,this._z=-t._z,a=-a):this.copy(t),a>=1)return this._w=o,this._x=n,this._y=s,this._z=r,this;const l=1-a*a;if(l<=Number.EPSILON){const d=1-e;return this._w=d*o+e*this._w,this._x=d*n+e*this._x,this._y=d*s+e*this._y,this._z=d*r+e*this._z,this.normalize(),this}const c=Math.sqrt(l),h=Math.atan2(c,a),f=Math.sin((1-e)*h)/c,u=Math.sin(e*h)/c;return this._w=o*f+this._w*u,this._x=n*f+this._x*u,this._y=s*f+this._y*u,this._z=r*f+this._z*u,this._onChangeCallback(),this}slerpQuaternions(t,e,n){return this.copy(t).slerp(e,n)}random(){const t=2*Math.PI*Math.random(),e=2*Math.PI*Math.random(),n=Math.random(),s=Math.sqrt(1-n),r=Math.sqrt(n);return this.set(s*Math.sin(t),s*Math.cos(t),r*Math.sin(e),r*Math.cos(e))}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._w===this._w}fromArray(t,e=0){return this._x=t[e],this._y=t[e+1],this._z=t[e+2],this._w=t[e+3],this._onChangeCallback(),this}toArray(t=[],e=0){return t[e]=this._x,t[e+1]=this._y,t[e+2]=this._z,t[e+3]=this._w,t}fromBufferAttribute(t,e){return this._x=t.getX(e),this._y=t.getY(e),this._z=t.getZ(e),this._w=t.getW(e),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}}class I{constructor(t=0,e=0,n=0){I.prototype.isVector3=!0,this.x=t,this.y=e,this.z=n}set(t,e,n){return n===void 0&&(n=this.z),this.x=t,this.y=e,this.z=n,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;case 2:this.z=e;break;default:throw new Error("index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this.z=t.z+e.z,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this.z+=t.z*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this.z=t.z-e.z,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this}multiplyVectors(t,e){return this.x=t.x*e.x,this.y=t.y*e.y,this.z=t.z*e.z,this}applyEuler(t){return this.applyQuaternion(Nl.setFromEuler(t))}applyAxisAngle(t,e){return this.applyQuaternion(Nl.setFromAxisAngle(t,e))}applyMatrix3(t){const e=this.x,n=this.y,s=this.z,r=t.elements;return this.x=r[0]*e+r[3]*n+r[6]*s,this.y=r[1]*e+r[4]*n+r[7]*s,this.z=r[2]*e+r[5]*n+r[8]*s,this}applyNormalMatrix(t){return this.applyMatrix3(t).normalize()}applyMatrix4(t){const e=this.x,n=this.y,s=this.z,r=t.elements,o=1/(r[3]*e+r[7]*n+r[11]*s+r[15]);return this.x=(r[0]*e+r[4]*n+r[8]*s+r[12])*o,this.y=(r[1]*e+r[5]*n+r[9]*s+r[13])*o,this.z=(r[2]*e+r[6]*n+r[10]*s+r[14])*o,this}applyQuaternion(t){const e=this.x,n=this.y,s=this.z,r=t.x,o=t.y,a=t.z,l=t.w,c=2*(o*s-a*n),h=2*(a*e-r*s),f=2*(r*n-o*e);return this.x=e+l*c+o*f-a*h,this.y=n+l*h+a*c-r*f,this.z=s+l*f+r*h-o*c,this}project(t){return this.applyMatrix4(t.matrixWorldInverse).applyMatrix4(t.projectionMatrix)}unproject(t){return this.applyMatrix4(t.projectionMatrixInverse).applyMatrix4(t.matrixWorld)}transformDirection(t){const e=this.x,n=this.y,s=this.z,r=t.elements;return this.x=r[0]*e+r[4]*n+r[8]*s,this.y=r[1]*e+r[5]*n+r[9]*s,this.z=r[2]*e+r[6]*n+r[10]*s,this.normalize()}divide(t){return this.x/=t.x,this.y/=t.y,this.z/=t.z,this}divideScalar(t){return this.multiplyScalar(1/t)}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this}clamp(t,e){return this.x=Math.max(t.x,Math.min(e.x,this.x)),this.y=Math.max(t.y,Math.min(e.y,this.y)),this.z=Math.max(t.z,Math.min(e.z,this.z)),this}clampScalar(t,e){return this.x=Math.max(t,Math.min(e,this.x)),this.y=Math.max(t,Math.min(e,this.y)),this.z=Math.max(t,Math.min(e,this.z)),this}clampLength(t,e){const n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(t,Math.min(e,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this.z+=(t.z-this.z)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this.z=t.z+(e.z-t.z)*n,this}cross(t){return this.crossVectors(this,t)}crossVectors(t,e){const n=t.x,s=t.y,r=t.z,o=e.x,a=e.y,l=e.z;return this.x=s*l-r*a,this.y=r*o-n*l,this.z=n*a-s*o,this}projectOnVector(t){const e=t.lengthSq();if(e===0)return this.set(0,0,0);const n=t.dot(this)/e;return this.copy(t).multiplyScalar(n)}projectOnPlane(t){return Do.copy(this).projectOnVector(t),this.sub(Do)}reflect(t){return this.sub(Do.copy(t).multiplyScalar(2*this.dot(t)))}angleTo(t){const e=Math.sqrt(this.lengthSq()*t.lengthSq());if(e===0)return Math.PI/2;const n=this.dot(t)/e;return Math.acos(Le(n,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){const e=this.x-t.x,n=this.y-t.y,s=this.z-t.z;return e*e+n*n+s*s}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)+Math.abs(this.z-t.z)}setFromSpherical(t){return this.setFromSphericalCoords(t.radius,t.phi,t.theta)}setFromSphericalCoords(t,e,n){const s=Math.sin(e)*t;return this.x=s*Math.sin(n),this.y=Math.cos(e)*t,this.z=s*Math.cos(n),this}setFromCylindrical(t){return this.setFromCylindricalCoords(t.radius,t.theta,t.y)}setFromCylindricalCoords(t,e,n){return this.x=t*Math.sin(e),this.y=n,this.z=t*Math.cos(e),this}setFromMatrixPosition(t){const e=t.elements;return this.x=e[12],this.y=e[13],this.z=e[14],this}setFromMatrixScale(t){const e=this.setFromMatrixColumn(t,0).length(),n=this.setFromMatrixColumn(t,1).length(),s=this.setFromMatrixColumn(t,2).length();return this.x=e,this.y=n,this.z=s,this}setFromMatrixColumn(t,e){return this.fromArray(t.elements,e*4)}setFromMatrix3Column(t,e){return this.fromArray(t.elements,e*3)}setFromEuler(t){return this.x=t._x,this.y=t._y,this.z=t._z,this}setFromColor(t){return this.x=t.r,this.y=t.g,this.z=t.b,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this.z=t[e+2],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t[e+2]=this.z,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this.z=t.getZ(e),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){const t=Math.random()*Math.PI*2,e=Math.random()*2-1,n=Math.sqrt(1-e*e);return this.x=n*Math.cos(t),this.y=e,this.z=n*Math.sin(t),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}}const Do=new I,Nl=new Ci;class Oe{constructor(t=new I(1/0,1/0,1/0),e=new I(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=t,this.max=e}set(t,e){return this.min.copy(t),this.max.copy(e),this}setFromArray(t){this.makeEmpty();for(let e=0,n=t.length;e<n;e+=3)this.expandByPoint(fn.fromArray(t,e));return this}setFromBufferAttribute(t){this.makeEmpty();for(let e=0,n=t.count;e<n;e++)this.expandByPoint(fn.fromBufferAttribute(t,e));return this}setFromPoints(t){this.makeEmpty();for(let e=0,n=t.length;e<n;e++)this.expandByPoint(t[e]);return this}setFromCenterAndSize(t,e){const n=fn.copy(e).multiplyScalar(.5);return this.min.copy(t).sub(n),this.max.copy(t).add(n),this}setFromObject(t,e=!1){return this.makeEmpty(),this.expandByObject(t,e)}clone(){return new this.constructor().copy(this)}copy(t){return this.min.copy(t.min),this.max.copy(t.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(t){return this.isEmpty()?t.set(0,0,0):t.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(t){return this.isEmpty()?t.set(0,0,0):t.subVectors(this.max,this.min)}expandByPoint(t){return this.min.min(t),this.max.max(t),this}expandByVector(t){return this.min.sub(t),this.max.add(t),this}expandByScalar(t){return this.min.addScalar(-t),this.max.addScalar(t),this}expandByObject(t,e=!1){t.updateWorldMatrix(!1,!1);const n=t.geometry;if(n!==void 0){const r=n.getAttribute("position");if(e===!0&&r!==void 0&&t.isInstancedMesh!==!0)for(let o=0,a=r.count;o<a;o++)t.isMesh===!0?t.getVertexPosition(o,fn):fn.fromBufferAttribute(r,o),fn.applyMatrix4(t.matrixWorld),this.expandByPoint(fn);else t.boundingBox!==void 0?(t.boundingBox===null&&t.computeBoundingBox(),ir.copy(t.boundingBox)):(n.boundingBox===null&&n.computeBoundingBox(),ir.copy(n.boundingBox)),ir.applyMatrix4(t.matrixWorld),this.union(ir)}const s=t.children;for(let r=0,o=s.length;r<o;r++)this.expandByObject(s[r],e);return this}containsPoint(t){return!(t.x<this.min.x||t.x>this.max.x||t.y<this.min.y||t.y>this.max.y||t.z<this.min.z||t.z>this.max.z)}containsBox(t){return this.min.x<=t.min.x&&t.max.x<=this.max.x&&this.min.y<=t.min.y&&t.max.y<=this.max.y&&this.min.z<=t.min.z&&t.max.z<=this.max.z}getParameter(t,e){return e.set((t.x-this.min.x)/(this.max.x-this.min.x),(t.y-this.min.y)/(this.max.y-this.min.y),(t.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(t){return!(t.max.x<this.min.x||t.min.x>this.max.x||t.max.y<this.min.y||t.min.y>this.max.y||t.max.z<this.min.z||t.min.z>this.max.z)}intersectsSphere(t){return this.clampPoint(t.center,fn),fn.distanceToSquared(t.center)<=t.radius*t.radius}intersectsPlane(t){let e,n;return t.normal.x>0?(e=t.normal.x*this.min.x,n=t.normal.x*this.max.x):(e=t.normal.x*this.max.x,n=t.normal.x*this.min.x),t.normal.y>0?(e+=t.normal.y*this.min.y,n+=t.normal.y*this.max.y):(e+=t.normal.y*this.max.y,n+=t.normal.y*this.min.y),t.normal.z>0?(e+=t.normal.z*this.min.z,n+=t.normal.z*this.max.z):(e+=t.normal.z*this.max.z,n+=t.normal.z*this.min.z),e<=-t.constant&&n>=-t.constant}intersectsTriangle(t){if(this.isEmpty())return!1;this.getCenter(Rs),sr.subVectors(this.max,Rs),zi.subVectors(t.a,Rs),Bi.subVectors(t.b,Rs),ki.subVectors(t.c,Rs),Xn.subVectors(Bi,zi),qn.subVectors(ki,Bi),mi.subVectors(zi,ki);let e=[0,-Xn.z,Xn.y,0,-qn.z,qn.y,0,-mi.z,mi.y,Xn.z,0,-Xn.x,qn.z,0,-qn.x,mi.z,0,-mi.x,-Xn.y,Xn.x,0,-qn.y,qn.x,0,-mi.y,mi.x,0];return!Uo(e,zi,Bi,ki,sr)||(e=[1,0,0,0,1,0,0,0,1],!Uo(e,zi,Bi,ki,sr))?!1:(rr.crossVectors(Xn,qn),e=[rr.x,rr.y,rr.z],Uo(e,zi,Bi,ki,sr))}clampPoint(t,e){return e.copy(t).clamp(this.min,this.max)}distanceToPoint(t){return this.clampPoint(t,fn).distanceTo(t)}getBoundingSphere(t){return this.isEmpty()?t.makeEmpty():(this.getCenter(t.center),t.radius=this.getSize(fn).length()*.5),t}intersect(t){return this.min.max(t.min),this.max.min(t.max),this.isEmpty()&&this.makeEmpty(),this}union(t){return this.min.min(t.min),this.max.max(t.max),this}applyMatrix4(t){return this.isEmpty()?this:(Dn[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(t),Dn[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(t),Dn[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(t),Dn[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(t),Dn[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(t),Dn[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(t),Dn[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(t),Dn[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(t),this.setFromPoints(Dn),this)}translate(t){return this.min.add(t),this.max.add(t),this}equals(t){return t.min.equals(this.min)&&t.max.equals(this.max)}}const Dn=[new I,new I,new I,new I,new I,new I,new I,new I],fn=new I,ir=new Oe,zi=new I,Bi=new I,ki=new I,Xn=new I,qn=new I,mi=new I,Rs=new I,sr=new I,rr=new I,gi=new I;function Uo(i,t,e,n,s){for(let r=0,o=i.length-3;r<=o;r+=3){gi.fromArray(i,r);const a=s.x*Math.abs(gi.x)+s.y*Math.abs(gi.y)+s.z*Math.abs(gi.z),l=t.dot(gi),c=e.dot(gi),h=n.dot(gi);if(Math.max(-Math.max(l,c,h),Math.min(l,c,h))>a)return!1}return!0}const Of=new Oe,Cs=new I,Io=new I;class Zs{constructor(t=new I,e=-1){this.isSphere=!0,this.center=t,this.radius=e}set(t,e){return this.center.copy(t),this.radius=e,this}setFromPoints(t,e){const n=this.center;e!==void 0?n.copy(e):Of.setFromPoints(t).getCenter(n);let s=0;for(let r=0,o=t.length;r<o;r++)s=Math.max(s,n.distanceToSquared(t[r]));return this.radius=Math.sqrt(s),this}copy(t){return this.center.copy(t.center),this.radius=t.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(t){return t.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(t){return t.distanceTo(this.center)-this.radius}intersectsSphere(t){const e=this.radius+t.radius;return t.center.distanceToSquared(this.center)<=e*e}intersectsBox(t){return t.intersectsSphere(this)}intersectsPlane(t){return Math.abs(t.distanceToPoint(this.center))<=this.radius}clampPoint(t,e){const n=this.center.distanceToSquared(t);return e.copy(t),n>this.radius*this.radius&&(e.sub(this.center).normalize(),e.multiplyScalar(this.radius).add(this.center)),e}getBoundingBox(t){return this.isEmpty()?(t.makeEmpty(),t):(t.set(this.center,this.center),t.expandByScalar(this.radius),t)}applyMatrix4(t){return this.center.applyMatrix4(t),this.radius=this.radius*t.getMaxScaleOnAxis(),this}translate(t){return this.center.add(t),this}expandByPoint(t){if(this.isEmpty())return this.center.copy(t),this.radius=0,this;Cs.subVectors(t,this.center);const e=Cs.lengthSq();if(e>this.radius*this.radius){const n=Math.sqrt(e),s=(n-this.radius)*.5;this.center.addScaledVector(Cs,s/n),this.radius+=s}return this}union(t){return t.isEmpty()?this:this.isEmpty()?(this.copy(t),this):(this.center.equals(t.center)===!0?this.radius=Math.max(this.radius,t.radius):(Io.subVectors(t.center,this.center).setLength(t.radius),this.expandByPoint(Cs.copy(t.center).add(Io)),this.expandByPoint(Cs.copy(t.center).sub(Io))),this)}equals(t){return t.center.equals(this.center)&&t.radius===this.radius}clone(){return new this.constructor().copy(this)}}const Un=new I,No=new I,or=new I,Yn=new I,Fo=new I,ar=new I,Oo=new I;class Js{constructor(t=new I,e=new I(0,0,-1)){this.origin=t,this.direction=e}set(t,e){return this.origin.copy(t),this.direction.copy(e),this}copy(t){return this.origin.copy(t.origin),this.direction.copy(t.direction),this}at(t,e){return e.copy(this.origin).addScaledVector(this.direction,t)}lookAt(t){return this.direction.copy(t).sub(this.origin).normalize(),this}recast(t){return this.origin.copy(this.at(t,Un)),this}closestPointToPoint(t,e){e.subVectors(t,this.origin);const n=e.dot(this.direction);return n<0?e.copy(this.origin):e.copy(this.origin).addScaledVector(this.direction,n)}distanceToPoint(t){return Math.sqrt(this.distanceSqToPoint(t))}distanceSqToPoint(t){const e=Un.subVectors(t,this.origin).dot(this.direction);return e<0?this.origin.distanceToSquared(t):(Un.copy(this.origin).addScaledVector(this.direction,e),Un.distanceToSquared(t))}distanceSqToSegment(t,e,n,s){No.copy(t).add(e).multiplyScalar(.5),or.copy(e).sub(t).normalize(),Yn.copy(this.origin).sub(No);const r=t.distanceTo(e)*.5,o=-this.direction.dot(or),a=Yn.dot(this.direction),l=-Yn.dot(or),c=Yn.lengthSq(),h=Math.abs(1-o*o);let f,u,d,g;if(h>0)if(f=o*l-a,u=o*a-l,g=r*h,f>=0)if(u>=-g)if(u<=g){const _=1/h;f*=_,u*=_,d=f*(f+o*u+2*a)+u*(o*f+u+2*l)+c}else u=r,f=Math.max(0,-(o*u+a)),d=-f*f+u*(u+2*l)+c;else u=-r,f=Math.max(0,-(o*u+a)),d=-f*f+u*(u+2*l)+c;else u<=-g?(f=Math.max(0,-(-o*r+a)),u=f>0?-r:Math.min(Math.max(-r,-l),r),d=-f*f+u*(u+2*l)+c):u<=g?(f=0,u=Math.min(Math.max(-r,-l),r),d=u*(u+2*l)+c):(f=Math.max(0,-(o*r+a)),u=f>0?r:Math.min(Math.max(-r,-l),r),d=-f*f+u*(u+2*l)+c);else u=o>0?-r:r,f=Math.max(0,-(o*u+a)),d=-f*f+u*(u+2*l)+c;return n&&n.copy(this.origin).addScaledVector(this.direction,f),s&&s.copy(No).addScaledVector(or,u),d}intersectSphere(t,e){Un.subVectors(t.center,this.origin);const n=Un.dot(this.direction),s=Un.dot(Un)-n*n,r=t.radius*t.radius;if(s>r)return null;const o=Math.sqrt(r-s),a=n-o,l=n+o;return l<0?null:a<0?this.at(l,e):this.at(a,e)}intersectsSphere(t){return this.distanceSqToPoint(t.center)<=t.radius*t.radius}distanceToPlane(t){const e=t.normal.dot(this.direction);if(e===0)return t.distanceToPoint(this.origin)===0?0:null;const n=-(this.origin.dot(t.normal)+t.constant)/e;return n>=0?n:null}intersectPlane(t,e){const n=this.distanceToPlane(t);return n===null?null:this.at(n,e)}intersectsPlane(t){const e=t.distanceToPoint(this.origin);return e===0||t.normal.dot(this.direction)*e<0}intersectBox(t,e){let n,s,r,o,a,l;const c=1/this.direction.x,h=1/this.direction.y,f=1/this.direction.z,u=this.origin;return c>=0?(n=(t.min.x-u.x)*c,s=(t.max.x-u.x)*c):(n=(t.max.x-u.x)*c,s=(t.min.x-u.x)*c),h>=0?(r=(t.min.y-u.y)*h,o=(t.max.y-u.y)*h):(r=(t.max.y-u.y)*h,o=(t.min.y-u.y)*h),n>o||r>s||((r>n||isNaN(n))&&(n=r),(o<s||isNaN(s))&&(s=o),f>=0?(a=(t.min.z-u.z)*f,l=(t.max.z-u.z)*f):(a=(t.max.z-u.z)*f,l=(t.min.z-u.z)*f),n>l||a>s)||((a>n||n!==n)&&(n=a),(l<s||s!==s)&&(s=l),s<0)?null:this.at(n>=0?n:s,e)}intersectsBox(t){return this.intersectBox(t,Un)!==null}intersectTriangle(t,e,n,s,r){Fo.subVectors(e,t),ar.subVectors(n,t),Oo.crossVectors(Fo,ar);let o=this.direction.dot(Oo),a;if(o>0){if(s)return null;a=1}else if(o<0)a=-1,o=-o;else return null;Yn.subVectors(this.origin,t);const l=a*this.direction.dot(ar.crossVectors(Yn,ar));if(l<0)return null;const c=a*this.direction.dot(Fo.cross(Yn));if(c<0||l+c>o)return null;const h=-a*Yn.dot(Oo);return h<0?null:this.at(h/o,r)}applyMatrix4(t){return this.origin.applyMatrix4(t),this.direction.transformDirection(t),this}equals(t){return t.origin.equals(this.origin)&&t.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}}class Kt{constructor(t,e,n,s,r,o,a,l,c,h,f,u,d,g,_,m){Kt.prototype.isMatrix4=!0,this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],t!==void 0&&this.set(t,e,n,s,r,o,a,l,c,h,f,u,d,g,_,m)}set(t,e,n,s,r,o,a,l,c,h,f,u,d,g,_,m){const p=this.elements;return p[0]=t,p[4]=e,p[8]=n,p[12]=s,p[1]=r,p[5]=o,p[9]=a,p[13]=l,p[2]=c,p[6]=h,p[10]=f,p[14]=u,p[3]=d,p[7]=g,p[11]=_,p[15]=m,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new Kt().fromArray(this.elements)}copy(t){const e=this.elements,n=t.elements;return e[0]=n[0],e[1]=n[1],e[2]=n[2],e[3]=n[3],e[4]=n[4],e[5]=n[5],e[6]=n[6],e[7]=n[7],e[8]=n[8],e[9]=n[9],e[10]=n[10],e[11]=n[11],e[12]=n[12],e[13]=n[13],e[14]=n[14],e[15]=n[15],this}copyPosition(t){const e=this.elements,n=t.elements;return e[12]=n[12],e[13]=n[13],e[14]=n[14],this}setFromMatrix3(t){const e=t.elements;return this.set(e[0],e[3],e[6],0,e[1],e[4],e[7],0,e[2],e[5],e[8],0,0,0,0,1),this}extractBasis(t,e,n){return t.setFromMatrixColumn(this,0),e.setFromMatrixColumn(this,1),n.setFromMatrixColumn(this,2),this}makeBasis(t,e,n){return this.set(t.x,e.x,n.x,0,t.y,e.y,n.y,0,t.z,e.z,n.z,0,0,0,0,1),this}extractRotation(t){const e=this.elements,n=t.elements,s=1/Hi.setFromMatrixColumn(t,0).length(),r=1/Hi.setFromMatrixColumn(t,1).length(),o=1/Hi.setFromMatrixColumn(t,2).length();return e[0]=n[0]*s,e[1]=n[1]*s,e[2]=n[2]*s,e[3]=0,e[4]=n[4]*r,e[5]=n[5]*r,e[6]=n[6]*r,e[7]=0,e[8]=n[8]*o,e[9]=n[9]*o,e[10]=n[10]*o,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,this}makeRotationFromEuler(t){const e=this.elements,n=t.x,s=t.y,r=t.z,o=Math.cos(n),a=Math.sin(n),l=Math.cos(s),c=Math.sin(s),h=Math.cos(r),f=Math.sin(r);if(t.order==="XYZ"){const u=o*h,d=o*f,g=a*h,_=a*f;e[0]=l*h,e[4]=-l*f,e[8]=c,e[1]=d+g*c,e[5]=u-_*c,e[9]=-a*l,e[2]=_-u*c,e[6]=g+d*c,e[10]=o*l}else if(t.order==="YXZ"){const u=l*h,d=l*f,g=c*h,_=c*f;e[0]=u+_*a,e[4]=g*a-d,e[8]=o*c,e[1]=o*f,e[5]=o*h,e[9]=-a,e[2]=d*a-g,e[6]=_+u*a,e[10]=o*l}else if(t.order==="ZXY"){const u=l*h,d=l*f,g=c*h,_=c*f;e[0]=u-_*a,e[4]=-o*f,e[8]=g+d*a,e[1]=d+g*a,e[5]=o*h,e[9]=_-u*a,e[2]=-o*c,e[6]=a,e[10]=o*l}else if(t.order==="ZYX"){const u=o*h,d=o*f,g=a*h,_=a*f;e[0]=l*h,e[4]=g*c-d,e[8]=u*c+_,e[1]=l*f,e[5]=_*c+u,e[9]=d*c-g,e[2]=-c,e[6]=a*l,e[10]=o*l}else if(t.order==="YZX"){const u=o*l,d=o*c,g=a*l,_=a*c;e[0]=l*h,e[4]=_-u*f,e[8]=g*f+d,e[1]=f,e[5]=o*h,e[9]=-a*h,e[2]=-c*h,e[6]=d*f+g,e[10]=u-_*f}else if(t.order==="XZY"){const u=o*l,d=o*c,g=a*l,_=a*c;e[0]=l*h,e[4]=-f,e[8]=c*h,e[1]=u*f+_,e[5]=o*h,e[9]=d*f-g,e[2]=g*f-d,e[6]=a*h,e[10]=_*f+u}return e[3]=0,e[7]=0,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,this}makeRotationFromQuaternion(t){return this.compose(zf,t,Bf)}lookAt(t,e,n){const s=this.elements;return Ye.subVectors(t,e),Ye.lengthSq()===0&&(Ye.z=1),Ye.normalize(),jn.crossVectors(n,Ye),jn.lengthSq()===0&&(Math.abs(n.z)===1?Ye.x+=1e-4:Ye.z+=1e-4,Ye.normalize(),jn.crossVectors(n,Ye)),jn.normalize(),lr.crossVectors(Ye,jn),s[0]=jn.x,s[4]=lr.x,s[8]=Ye.x,s[1]=jn.y,s[5]=lr.y,s[9]=Ye.y,s[2]=jn.z,s[6]=lr.z,s[10]=Ye.z,this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,e){const n=t.elements,s=e.elements,r=this.elements,o=n[0],a=n[4],l=n[8],c=n[12],h=n[1],f=n[5],u=n[9],d=n[13],g=n[2],_=n[6],m=n[10],p=n[14],M=n[3],x=n[7],E=n[11],A=n[15],b=s[0],S=s[4],P=s[8],T=s[12],v=s[1],R=s[5],L=s[9],D=s[13],N=s[2],z=s[6],O=s[10],Y=s[14],B=s[3],it=s[7],st=s[11],ht=s[15];return r[0]=o*b+a*v+l*N+c*B,r[4]=o*S+a*R+l*z+c*it,r[8]=o*P+a*L+l*O+c*st,r[12]=o*T+a*D+l*Y+c*ht,r[1]=h*b+f*v+u*N+d*B,r[5]=h*S+f*R+u*z+d*it,r[9]=h*P+f*L+u*O+d*st,r[13]=h*T+f*D+u*Y+d*ht,r[2]=g*b+_*v+m*N+p*B,r[6]=g*S+_*R+m*z+p*it,r[10]=g*P+_*L+m*O+p*st,r[14]=g*T+_*D+m*Y+p*ht,r[3]=M*b+x*v+E*N+A*B,r[7]=M*S+x*R+E*z+A*it,r[11]=M*P+x*L+E*O+A*st,r[15]=M*T+x*D+E*Y+A*ht,this}multiplyScalar(t){const e=this.elements;return e[0]*=t,e[4]*=t,e[8]*=t,e[12]*=t,e[1]*=t,e[5]*=t,e[9]*=t,e[13]*=t,e[2]*=t,e[6]*=t,e[10]*=t,e[14]*=t,e[3]*=t,e[7]*=t,e[11]*=t,e[15]*=t,this}determinant(){const t=this.elements,e=t[0],n=t[4],s=t[8],r=t[12],o=t[1],a=t[5],l=t[9],c=t[13],h=t[2],f=t[6],u=t[10],d=t[14],g=t[3],_=t[7],m=t[11],p=t[15];return g*(+r*l*f-s*c*f-r*a*u+n*c*u+s*a*d-n*l*d)+_*(+e*l*d-e*c*u+r*o*u-s*o*d+s*c*h-r*l*h)+m*(+e*c*f-e*a*d-r*o*f+n*o*d+r*a*h-n*c*h)+p*(-s*a*h-e*l*f+e*a*u+s*o*f-n*o*u+n*l*h)}transpose(){const t=this.elements;let e;return e=t[1],t[1]=t[4],t[4]=e,e=t[2],t[2]=t[8],t[8]=e,e=t[6],t[6]=t[9],t[9]=e,e=t[3],t[3]=t[12],t[12]=e,e=t[7],t[7]=t[13],t[13]=e,e=t[11],t[11]=t[14],t[14]=e,this}setPosition(t,e,n){const s=this.elements;return t.isVector3?(s[12]=t.x,s[13]=t.y,s[14]=t.z):(s[12]=t,s[13]=e,s[14]=n),this}invert(){const t=this.elements,e=t[0],n=t[1],s=t[2],r=t[3],o=t[4],a=t[5],l=t[6],c=t[7],h=t[8],f=t[9],u=t[10],d=t[11],g=t[12],_=t[13],m=t[14],p=t[15],M=f*m*c-_*u*c+_*l*d-a*m*d-f*l*p+a*u*p,x=g*u*c-h*m*c-g*l*d+o*m*d+h*l*p-o*u*p,E=h*_*c-g*f*c+g*a*d-o*_*d-h*a*p+o*f*p,A=g*f*l-h*_*l-g*a*u+o*_*u+h*a*m-o*f*m,b=e*M+n*x+s*E+r*A;if(b===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);const S=1/b;return t[0]=M*S,t[1]=(_*u*r-f*m*r-_*s*d+n*m*d+f*s*p-n*u*p)*S,t[2]=(a*m*r-_*l*r+_*s*c-n*m*c-a*s*p+n*l*p)*S,t[3]=(f*l*r-a*u*r-f*s*c+n*u*c+a*s*d-n*l*d)*S,t[4]=x*S,t[5]=(h*m*r-g*u*r+g*s*d-e*m*d-h*s*p+e*u*p)*S,t[6]=(g*l*r-o*m*r-g*s*c+e*m*c+o*s*p-e*l*p)*S,t[7]=(o*u*r-h*l*r+h*s*c-e*u*c-o*s*d+e*l*d)*S,t[8]=E*S,t[9]=(g*f*r-h*_*r-g*n*d+e*_*d+h*n*p-e*f*p)*S,t[10]=(o*_*r-g*a*r+g*n*c-e*_*c-o*n*p+e*a*p)*S,t[11]=(h*a*r-o*f*r-h*n*c+e*f*c+o*n*d-e*a*d)*S,t[12]=A*S,t[13]=(h*_*s-g*f*s+g*n*u-e*_*u-h*n*m+e*f*m)*S,t[14]=(g*a*s-o*_*s-g*n*l+e*_*l+o*n*m-e*a*m)*S,t[15]=(o*f*s-h*a*s+h*n*l-e*f*l-o*n*u+e*a*u)*S,this}scale(t){const e=this.elements,n=t.x,s=t.y,r=t.z;return e[0]*=n,e[4]*=s,e[8]*=r,e[1]*=n,e[5]*=s,e[9]*=r,e[2]*=n,e[6]*=s,e[10]*=r,e[3]*=n,e[7]*=s,e[11]*=r,this}getMaxScaleOnAxis(){const t=this.elements,e=t[0]*t[0]+t[1]*t[1]+t[2]*t[2],n=t[4]*t[4]+t[5]*t[5]+t[6]*t[6],s=t[8]*t[8]+t[9]*t[9]+t[10]*t[10];return Math.sqrt(Math.max(e,n,s))}makeTranslation(t,e,n){return t.isVector3?this.set(1,0,0,t.x,0,1,0,t.y,0,0,1,t.z,0,0,0,1):this.set(1,0,0,t,0,1,0,e,0,0,1,n,0,0,0,1),this}makeRotationX(t){const e=Math.cos(t),n=Math.sin(t);return this.set(1,0,0,0,0,e,-n,0,0,n,e,0,0,0,0,1),this}makeRotationY(t){const e=Math.cos(t),n=Math.sin(t);return this.set(e,0,n,0,0,1,0,0,-n,0,e,0,0,0,0,1),this}makeRotationZ(t){const e=Math.cos(t),n=Math.sin(t);return this.set(e,-n,0,0,n,e,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(t,e){const n=Math.cos(e),s=Math.sin(e),r=1-n,o=t.x,a=t.y,l=t.z,c=r*o,h=r*a;return this.set(c*o+n,c*a-s*l,c*l+s*a,0,c*a+s*l,h*a+n,h*l-s*o,0,c*l-s*a,h*l+s*o,r*l*l+n,0,0,0,0,1),this}makeScale(t,e,n){return this.set(t,0,0,0,0,e,0,0,0,0,n,0,0,0,0,1),this}makeShear(t,e,n,s,r,o){return this.set(1,n,r,0,t,1,o,0,e,s,1,0,0,0,0,1),this}compose(t,e,n){const s=this.elements,r=e._x,o=e._y,a=e._z,l=e._w,c=r+r,h=o+o,f=a+a,u=r*c,d=r*h,g=r*f,_=o*h,m=o*f,p=a*f,M=l*c,x=l*h,E=l*f,A=n.x,b=n.y,S=n.z;return s[0]=(1-(_+p))*A,s[1]=(d+E)*A,s[2]=(g-x)*A,s[3]=0,s[4]=(d-E)*b,s[5]=(1-(u+p))*b,s[6]=(m+M)*b,s[7]=0,s[8]=(g+x)*S,s[9]=(m-M)*S,s[10]=(1-(u+_))*S,s[11]=0,s[12]=t.x,s[13]=t.y,s[14]=t.z,s[15]=1,this}decompose(t,e,n){const s=this.elements;let r=Hi.set(s[0],s[1],s[2]).length();const o=Hi.set(s[4],s[5],s[6]).length(),a=Hi.set(s[8],s[9],s[10]).length();this.determinant()<0&&(r=-r),t.x=s[12],t.y=s[13],t.z=s[14],dn.copy(this);const c=1/r,h=1/o,f=1/a;return dn.elements[0]*=c,dn.elements[1]*=c,dn.elements[2]*=c,dn.elements[4]*=h,dn.elements[5]*=h,dn.elements[6]*=h,dn.elements[8]*=f,dn.elements[9]*=f,dn.elements[10]*=f,e.setFromRotationMatrix(dn),n.x=r,n.y=o,n.z=a,this}makePerspective(t,e,n,s,r,o,a=kn){const l=this.elements,c=2*r/(e-t),h=2*r/(n-s),f=(e+t)/(e-t),u=(n+s)/(n-s);let d,g;if(a===kn)d=-(o+r)/(o-r),g=-2*o*r/(o-r);else if(a===io)d=-o/(o-r),g=-o*r/(o-r);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+a);return l[0]=c,l[4]=0,l[8]=f,l[12]=0,l[1]=0,l[5]=h,l[9]=u,l[13]=0,l[2]=0,l[6]=0,l[10]=d,l[14]=g,l[3]=0,l[7]=0,l[11]=-1,l[15]=0,this}makeOrthographic(t,e,n,s,r,o,a=kn){const l=this.elements,c=1/(e-t),h=1/(n-s),f=1/(o-r),u=(e+t)*c,d=(n+s)*h;let g,_;if(a===kn)g=(o+r)*f,_=-2*f;else if(a===io)g=r*f,_=-1*f;else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+a);return l[0]=2*c,l[4]=0,l[8]=0,l[12]=-u,l[1]=0,l[5]=2*h,l[9]=0,l[13]=-d,l[2]=0,l[6]=0,l[10]=_,l[14]=-g,l[3]=0,l[7]=0,l[11]=0,l[15]=1,this}equals(t){const e=this.elements,n=t.elements;for(let s=0;s<16;s++)if(e[s]!==n[s])return!1;return!0}fromArray(t,e=0){for(let n=0;n<16;n++)this.elements[n]=t[n+e];return this}toArray(t=[],e=0){const n=this.elements;return t[e]=n[0],t[e+1]=n[1],t[e+2]=n[2],t[e+3]=n[3],t[e+4]=n[4],t[e+5]=n[5],t[e+6]=n[6],t[e+7]=n[7],t[e+8]=n[8],t[e+9]=n[9],t[e+10]=n[10],t[e+11]=n[11],t[e+12]=n[12],t[e+13]=n[13],t[e+14]=n[14],t[e+15]=n[15],t}}const Hi=new I,dn=new Kt,zf=new I(0,0,0),Bf=new I(1,1,1),jn=new I,lr=new I,Ye=new I,Fl=new Kt,Ol=new Ci;class Rn{constructor(t=0,e=0,n=0,s=Rn.DEFAULT_ORDER){this.isEuler=!0,this._x=t,this._y=e,this._z=n,this._order=s}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get order(){return this._order}set order(t){this._order=t,this._onChangeCallback()}set(t,e,n,s=this._order){return this._x=t,this._y=e,this._z=n,this._order=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(t){return this._x=t._x,this._y=t._y,this._z=t._z,this._order=t._order,this._onChangeCallback(),this}setFromRotationMatrix(t,e=this._order,n=!0){const s=t.elements,r=s[0],o=s[4],a=s[8],l=s[1],c=s[5],h=s[9],f=s[2],u=s[6],d=s[10];switch(e){case"XYZ":this._y=Math.asin(Le(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(-h,d),this._z=Math.atan2(-o,r)):(this._x=Math.atan2(u,c),this._z=0);break;case"YXZ":this._x=Math.asin(-Le(h,-1,1)),Math.abs(h)<.9999999?(this._y=Math.atan2(a,d),this._z=Math.atan2(l,c)):(this._y=Math.atan2(-f,r),this._z=0);break;case"ZXY":this._x=Math.asin(Le(u,-1,1)),Math.abs(u)<.9999999?(this._y=Math.atan2(-f,d),this._z=Math.atan2(-o,c)):(this._y=0,this._z=Math.atan2(l,r));break;case"ZYX":this._y=Math.asin(-Le(f,-1,1)),Math.abs(f)<.9999999?(this._x=Math.atan2(u,d),this._z=Math.atan2(l,r)):(this._x=0,this._z=Math.atan2(-o,c));break;case"YZX":this._z=Math.asin(Le(l,-1,1)),Math.abs(l)<.9999999?(this._x=Math.atan2(-h,c),this._y=Math.atan2(-f,r)):(this._x=0,this._y=Math.atan2(a,d));break;case"XZY":this._z=Math.asin(-Le(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(u,c),this._y=Math.atan2(a,r)):(this._x=Math.atan2(-h,d),this._y=0);break;default:console.warn("THREE.Euler: .setFromRotationMatrix() encountered an unknown order: "+e)}return this._order=e,n===!0&&this._onChangeCallback(),this}setFromQuaternion(t,e,n){return Fl.makeRotationFromQuaternion(t),this.setFromRotationMatrix(Fl,e,n)}setFromVector3(t,e=this._order){return this.set(t.x,t.y,t.z,e)}reorder(t){return Ol.setFromEuler(this),this.setFromQuaternion(Ol,t)}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._order===this._order}fromArray(t){return this._x=t[0],this._y=t[1],this._z=t[2],t[3]!==void 0&&(this._order=t[3]),this._onChangeCallback(),this}toArray(t=[],e=0){return t[e]=this._x,t[e+1]=this._y,t[e+2]=this._z,t[e+3]=this._order,t}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}}Rn.DEFAULT_ORDER="XYZ";class Ga{constructor(){this.mask=1}set(t){this.mask=(1<<t|0)>>>0}enable(t){this.mask|=1<<t|0}enableAll(){this.mask=-1}toggle(t){this.mask^=1<<t|0}disable(t){this.mask&=~(1<<t|0)}disableAll(){this.mask=0}test(t){return(this.mask&t.mask)!==0}isEnabled(t){return(this.mask&(1<<t|0))!==0}}let kf=0;const zl=new I,Gi=new Ci,In=new Kt,cr=new I,Ps=new I,Hf=new I,Gf=new Ci,Bl=new I(1,0,0),kl=new I(0,1,0),Hl=new I(0,0,1),Gl={type:"added"},Vf={type:"removed"},Vi={type:"childadded",child:null},zo={type:"childremoved",child:null};class Ae extends Di{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:kf++}),this.uuid=$s(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=Ae.DEFAULT_UP.clone();const t=new I,e=new Rn,n=new Ci,s=new I(1,1,1);function r(){n.setFromEuler(e,!1)}function o(){e.setFromQuaternion(n,void 0,!1)}e._onChange(r),n._onChange(o),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:t},rotation:{configurable:!0,enumerable:!0,value:e},quaternion:{configurable:!0,enumerable:!0,value:n},scale:{configurable:!0,enumerable:!0,value:s},modelViewMatrix:{value:new Kt},normalMatrix:{value:new Vt}}),this.matrix=new Kt,this.matrixWorld=new Kt,this.matrixAutoUpdate=Ae.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=Ae.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new Ga,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.userData={}}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(t){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(t),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(t){return this.quaternion.premultiply(t),this}setRotationFromAxisAngle(t,e){this.quaternion.setFromAxisAngle(t,e)}setRotationFromEuler(t){this.quaternion.setFromEuler(t,!0)}setRotationFromMatrix(t){this.quaternion.setFromRotationMatrix(t)}setRotationFromQuaternion(t){this.quaternion.copy(t)}rotateOnAxis(t,e){return Gi.setFromAxisAngle(t,e),this.quaternion.multiply(Gi),this}rotateOnWorldAxis(t,e){return Gi.setFromAxisAngle(t,e),this.quaternion.premultiply(Gi),this}rotateX(t){return this.rotateOnAxis(Bl,t)}rotateY(t){return this.rotateOnAxis(kl,t)}rotateZ(t){return this.rotateOnAxis(Hl,t)}translateOnAxis(t,e){return zl.copy(t).applyQuaternion(this.quaternion),this.position.add(zl.multiplyScalar(e)),this}translateX(t){return this.translateOnAxis(Bl,t)}translateY(t){return this.translateOnAxis(kl,t)}translateZ(t){return this.translateOnAxis(Hl,t)}localToWorld(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(this.matrixWorld)}worldToLocal(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(In.copy(this.matrixWorld).invert())}lookAt(t,e,n){t.isVector3?cr.copy(t):cr.set(t,e,n);const s=this.parent;this.updateWorldMatrix(!0,!1),Ps.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?In.lookAt(Ps,cr,this.up):In.lookAt(cr,Ps,this.up),this.quaternion.setFromRotationMatrix(In),s&&(In.extractRotation(s.matrixWorld),Gi.setFromRotationMatrix(In),this.quaternion.premultiply(Gi.invert()))}add(t){if(arguments.length>1){for(let e=0;e<arguments.length;e++)this.add(arguments[e]);return this}return t===this?(console.error("THREE.Object3D.add: object can't be added as a child of itself.",t),this):(t&&t.isObject3D?(t.removeFromParent(),t.parent=this,this.children.push(t),t.dispatchEvent(Gl),Vi.child=t,this.dispatchEvent(Vi),Vi.child=null):console.error("THREE.Object3D.add: object not an instance of THREE.Object3D.",t),this)}remove(t){if(arguments.length>1){for(let n=0;n<arguments.length;n++)this.remove(arguments[n]);return this}const e=this.children.indexOf(t);return e!==-1&&(t.parent=null,this.children.splice(e,1),t.dispatchEvent(Vf),zo.child=t,this.dispatchEvent(zo),zo.child=null),this}removeFromParent(){const t=this.parent;return t!==null&&t.remove(this),this}clear(){return this.remove(...this.children)}attach(t){return this.updateWorldMatrix(!0,!1),In.copy(this.matrixWorld).invert(),t.parent!==null&&(t.parent.updateWorldMatrix(!0,!1),In.multiply(t.parent.matrixWorld)),t.applyMatrix4(In),t.removeFromParent(),t.parent=this,this.children.push(t),t.updateWorldMatrix(!1,!0),t.dispatchEvent(Gl),Vi.child=t,this.dispatchEvent(Vi),Vi.child=null,this}getObjectById(t){return this.getObjectByProperty("id",t)}getObjectByName(t){return this.getObjectByProperty("name",t)}getObjectByProperty(t,e){if(this[t]===e)return this;for(let n=0,s=this.children.length;n<s;n++){const o=this.children[n].getObjectByProperty(t,e);if(o!==void 0)return o}}getObjectsByProperty(t,e,n=[]){this[t]===e&&n.push(this);const s=this.children;for(let r=0,o=s.length;r<o;r++)s[r].getObjectsByProperty(t,e,n);return n}getWorldPosition(t){return this.updateWorldMatrix(!0,!1),t.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Ps,t,Hf),t}getWorldScale(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Ps,Gf,t),t}getWorldDirection(t){this.updateWorldMatrix(!0,!1);const e=this.matrixWorld.elements;return t.set(e[8],e[9],e[10]).normalize()}raycast(){}traverse(t){t(this);const e=this.children;for(let n=0,s=e.length;n<s;n++)e[n].traverse(t)}traverseVisible(t){if(this.visible===!1)return;t(this);const e=this.children;for(let n=0,s=e.length;n<s;n++)e[n].traverseVisible(t)}traverseAncestors(t){const e=this.parent;e!==null&&(t(e),e.traverseAncestors(t))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale),this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(t){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||t)&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix),this.matrixWorldNeedsUpdate=!1,t=!0);const e=this.children;for(let n=0,s=e.length;n<s;n++){const r=e[n];(r.matrixWorldAutoUpdate===!0||t===!0)&&r.updateMatrixWorld(t)}}updateWorldMatrix(t,e){const n=this.parent;if(t===!0&&n!==null&&n.matrixWorldAutoUpdate===!0&&n.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix),e===!0){const s=this.children;for(let r=0,o=s.length;r<o;r++){const a=s[r];a.matrixWorldAutoUpdate===!0&&a.updateWorldMatrix(!1,!0)}}}toJSON(t){const e=t===void 0||typeof t=="string",n={};e&&(t={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},n.metadata={version:4.6,type:"Object",generator:"Object3D.toJSON"});const s={};s.uuid=this.uuid,s.type=this.type,this.name!==""&&(s.name=this.name),this.castShadow===!0&&(s.castShadow=!0),this.receiveShadow===!0&&(s.receiveShadow=!0),this.visible===!1&&(s.visible=!1),this.frustumCulled===!1&&(s.frustumCulled=!1),this.renderOrder!==0&&(s.renderOrder=this.renderOrder),Object.keys(this.userData).length>0&&(s.userData=this.userData),s.layers=this.layers.mask,s.matrix=this.matrix.toArray(),s.up=this.up.toArray(),this.matrixAutoUpdate===!1&&(s.matrixAutoUpdate=!1),this.isInstancedMesh&&(s.type="InstancedMesh",s.count=this.count,s.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(s.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(s.type="BatchedMesh",s.perObjectFrustumCulled=this.perObjectFrustumCulled,s.sortObjects=this.sortObjects,s.drawRanges=this._drawRanges,s.reservedRanges=this._reservedRanges,s.visibility=this._visibility,s.active=this._active,s.bounds=this._bounds.map(a=>({boxInitialized:a.boxInitialized,boxMin:a.box.min.toArray(),boxMax:a.box.max.toArray(),sphereInitialized:a.sphereInitialized,sphereRadius:a.sphere.radius,sphereCenter:a.sphere.center.toArray()})),s.maxGeometryCount=this._maxGeometryCount,s.maxVertexCount=this._maxVertexCount,s.maxIndexCount=this._maxIndexCount,s.geometryInitialized=this._geometryInitialized,s.geometryCount=this._geometryCount,s.matricesTexture=this._matricesTexture.toJSON(t),this._colorsTexture!==null&&(s.colorsTexture=this._colorsTexture.toJSON(t)),this.boundingSphere!==null&&(s.boundingSphere={center:s.boundingSphere.center.toArray(),radius:s.boundingSphere.radius}),this.boundingBox!==null&&(s.boundingBox={min:s.boundingBox.min.toArray(),max:s.boundingBox.max.toArray()}));function r(a,l){return a[l.uuid]===void 0&&(a[l.uuid]=l.toJSON(t)),l.uuid}if(this.isScene)this.background&&(this.background.isColor?s.background=this.background.toJSON():this.background.isTexture&&(s.background=this.background.toJSON(t).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(s.environment=this.environment.toJSON(t).uuid);else if(this.isMesh||this.isLine||this.isPoints){s.geometry=r(t.geometries,this.geometry);const a=this.geometry.parameters;if(a!==void 0&&a.shapes!==void 0){const l=a.shapes;if(Array.isArray(l))for(let c=0,h=l.length;c<h;c++){const f=l[c];r(t.shapes,f)}else r(t.shapes,l)}}if(this.isSkinnedMesh&&(s.bindMode=this.bindMode,s.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(r(t.skeletons,this.skeleton),s.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){const a=[];for(let l=0,c=this.material.length;l<c;l++)a.push(r(t.materials,this.material[l]));s.material=a}else s.material=r(t.materials,this.material);if(this.children.length>0){s.children=[];for(let a=0;a<this.children.length;a++)s.children.push(this.children[a].toJSON(t).object)}if(this.animations.length>0){s.animations=[];for(let a=0;a<this.animations.length;a++){const l=this.animations[a];s.animations.push(r(t.animations,l))}}if(e){const a=o(t.geometries),l=o(t.materials),c=o(t.textures),h=o(t.images),f=o(t.shapes),u=o(t.skeletons),d=o(t.animations),g=o(t.nodes);a.length>0&&(n.geometries=a),l.length>0&&(n.materials=l),c.length>0&&(n.textures=c),h.length>0&&(n.images=h),f.length>0&&(n.shapes=f),u.length>0&&(n.skeletons=u),d.length>0&&(n.animations=d),g.length>0&&(n.nodes=g)}return n.object=s,n;function o(a){const l=[];for(const c in a){const h=a[c];delete h.metadata,l.push(h)}return l}}clone(t){return new this.constructor().copy(this,t)}copy(t,e=!0){if(this.name=t.name,this.up.copy(t.up),this.position.copy(t.position),this.rotation.order=t.rotation.order,this.quaternion.copy(t.quaternion),this.scale.copy(t.scale),this.matrix.copy(t.matrix),this.matrixWorld.copy(t.matrixWorld),this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrixWorldAutoUpdate=t.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=t.matrixWorldNeedsUpdate,this.layers.mask=t.layers.mask,this.visible=t.visible,this.castShadow=t.castShadow,this.receiveShadow=t.receiveShadow,this.frustumCulled=t.frustumCulled,this.renderOrder=t.renderOrder,this.animations=t.animations.slice(),this.userData=JSON.parse(JSON.stringify(t.userData)),e===!0)for(let n=0;n<t.children.length;n++){const s=t.children[n];this.add(s.clone())}return this}}Ae.DEFAULT_UP=new I(0,1,0);Ae.DEFAULT_MATRIX_AUTO_UPDATE=!0;Ae.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;const pn=new I,Nn=new I,Bo=new I,Fn=new I,Wi=new I,Xi=new I,Vl=new I,ko=new I,Ho=new I,Go=new I;class Ne{constructor(t=new I,e=new I,n=new I){this.a=t,this.b=e,this.c=n}static getNormal(t,e,n,s){s.subVectors(n,e),pn.subVectors(t,e),s.cross(pn);const r=s.lengthSq();return r>0?s.multiplyScalar(1/Math.sqrt(r)):s.set(0,0,0)}static getBarycoord(t,e,n,s,r){pn.subVectors(s,e),Nn.subVectors(n,e),Bo.subVectors(t,e);const o=pn.dot(pn),a=pn.dot(Nn),l=pn.dot(Bo),c=Nn.dot(Nn),h=Nn.dot(Bo),f=o*c-a*a;if(f===0)return r.set(0,0,0),null;const u=1/f,d=(c*l-a*h)*u,g=(o*h-a*l)*u;return r.set(1-d-g,g,d)}static containsPoint(t,e,n,s){return this.getBarycoord(t,e,n,s,Fn)===null?!1:Fn.x>=0&&Fn.y>=0&&Fn.x+Fn.y<=1}static getInterpolation(t,e,n,s,r,o,a,l){return this.getBarycoord(t,e,n,s,Fn)===null?(l.x=0,l.y=0,"z"in l&&(l.z=0),"w"in l&&(l.w=0),null):(l.setScalar(0),l.addScaledVector(r,Fn.x),l.addScaledVector(o,Fn.y),l.addScaledVector(a,Fn.z),l)}static isFrontFacing(t,e,n,s){return pn.subVectors(n,e),Nn.subVectors(t,e),pn.cross(Nn).dot(s)<0}set(t,e,n){return this.a.copy(t),this.b.copy(e),this.c.copy(n),this}setFromPointsAndIndices(t,e,n,s){return this.a.copy(t[e]),this.b.copy(t[n]),this.c.copy(t[s]),this}setFromAttributeAndIndices(t,e,n,s){return this.a.fromBufferAttribute(t,e),this.b.fromBufferAttribute(t,n),this.c.fromBufferAttribute(t,s),this}clone(){return new this.constructor().copy(this)}copy(t){return this.a.copy(t.a),this.b.copy(t.b),this.c.copy(t.c),this}getArea(){return pn.subVectors(this.c,this.b),Nn.subVectors(this.a,this.b),pn.cross(Nn).length()*.5}getMidpoint(t){return t.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(t){return Ne.getNormal(this.a,this.b,this.c,t)}getPlane(t){return t.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(t,e){return Ne.getBarycoord(t,this.a,this.b,this.c,e)}getInterpolation(t,e,n,s,r){return Ne.getInterpolation(t,this.a,this.b,this.c,e,n,s,r)}containsPoint(t){return Ne.containsPoint(t,this.a,this.b,this.c)}isFrontFacing(t){return Ne.isFrontFacing(this.a,this.b,this.c,t)}intersectsBox(t){return t.intersectsTriangle(this)}closestPointToPoint(t,e){const n=this.a,s=this.b,r=this.c;let o,a;Wi.subVectors(s,n),Xi.subVectors(r,n),ko.subVectors(t,n);const l=Wi.dot(ko),c=Xi.dot(ko);if(l<=0&&c<=0)return e.copy(n);Ho.subVectors(t,s);const h=Wi.dot(Ho),f=Xi.dot(Ho);if(h>=0&&f<=h)return e.copy(s);const u=l*f-h*c;if(u<=0&&l>=0&&h<=0)return o=l/(l-h),e.copy(n).addScaledVector(Wi,o);Go.subVectors(t,r);const d=Wi.dot(Go),g=Xi.dot(Go);if(g>=0&&d<=g)return e.copy(r);const _=d*c-l*g;if(_<=0&&c>=0&&g<=0)return a=c/(c-g),e.copy(n).addScaledVector(Xi,a);const m=h*g-d*f;if(m<=0&&f-h>=0&&d-g>=0)return Vl.subVectors(r,s),a=(f-h)/(f-h+(d-g)),e.copy(s).addScaledVector(Vl,a);const p=1/(m+_+u);return o=_*p,a=u*p,e.copy(n).addScaledVector(Wi,o).addScaledVector(Xi,a)}equals(t){return t.a.equals(this.a)&&t.b.equals(this.b)&&t.c.equals(this.c)}}const Lu={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},Kn={h:0,s:0,l:0},ur={h:0,s:0,l:0};function Vo(i,t,e){return e<0&&(e+=1),e>1&&(e-=1),e<1/6?i+(t-i)*6*e:e<1/2?t:e<2/3?i+(t-i)*6*(2/3-e):i}class jt{constructor(t,e,n){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(t,e,n)}set(t,e,n){if(e===void 0&&n===void 0){const s=t;s&&s.isColor?this.copy(s):typeof s=="number"?this.setHex(s):typeof s=="string"&&this.setStyle(s)}else this.setRGB(t,e,n);return this}setScalar(t){return this.r=t,this.g=t,this.b=t,this}setHex(t,e=Sn){return t=Math.floor(t),this.r=(t>>16&255)/255,this.g=(t>>8&255)/255,this.b=(t&255)/255,ne.toWorkingColorSpace(this,e),this}setRGB(t,e,n,s=ne.workingColorSpace){return this.r=t,this.g=e,this.b=n,ne.toWorkingColorSpace(this,s),this}setHSL(t,e,n,s=ne.workingColorSpace){if(t=wf(t,1),e=Le(e,0,1),n=Le(n,0,1),e===0)this.r=this.g=this.b=n;else{const r=n<=.5?n*(1+e):n+e-n*e,o=2*n-r;this.r=Vo(o,r,t+1/3),this.g=Vo(o,r,t),this.b=Vo(o,r,t-1/3)}return ne.toWorkingColorSpace(this,s),this}setStyle(t,e=Sn){function n(r){r!==void 0&&parseFloat(r)<1&&console.warn("THREE.Color: Alpha component of "+t+" will be ignored.")}let s;if(s=/^(\w+)\(([^\)]*)\)/.exec(t)){let r;const o=s[1],a=s[2];switch(o){case"rgb":case"rgba":if(r=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return n(r[4]),this.setRGB(Math.min(255,parseInt(r[1],10))/255,Math.min(255,parseInt(r[2],10))/255,Math.min(255,parseInt(r[3],10))/255,e);if(r=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return n(r[4]),this.setRGB(Math.min(100,parseInt(r[1],10))/100,Math.min(100,parseInt(r[2],10))/100,Math.min(100,parseInt(r[3],10))/100,e);break;case"hsl":case"hsla":if(r=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return n(r[4]),this.setHSL(parseFloat(r[1])/360,parseFloat(r[2])/100,parseFloat(r[3])/100,e);break;default:console.warn("THREE.Color: Unknown color model "+t)}}else if(s=/^\#([A-Fa-f\d]+)$/.exec(t)){const r=s[1],o=r.length;if(o===3)return this.setRGB(parseInt(r.charAt(0),16)/15,parseInt(r.charAt(1),16)/15,parseInt(r.charAt(2),16)/15,e);if(o===6)return this.setHex(parseInt(r,16),e);console.warn("THREE.Color: Invalid hex color "+t)}else if(t&&t.length>0)return this.setColorName(t,e);return this}setColorName(t,e=Sn){const n=Lu[t.toLowerCase()];return n!==void 0?this.setHex(n,e):console.warn("THREE.Color: Unknown color "+t),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(t){return this.r=t.r,this.g=t.g,this.b=t.b,this}copySRGBToLinear(t){return this.r=_s(t.r),this.g=_s(t.g),this.b=_s(t.b),this}copyLinearToSRGB(t){return this.r=Po(t.r),this.g=Po(t.g),this.b=Po(t.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(t=Sn){return ne.fromWorkingColorSpace(Pe.copy(this),t),Math.round(Le(Pe.r*255,0,255))*65536+Math.round(Le(Pe.g*255,0,255))*256+Math.round(Le(Pe.b*255,0,255))}getHexString(t=Sn){return("000000"+this.getHex(t).toString(16)).slice(-6)}getHSL(t,e=ne.workingColorSpace){ne.fromWorkingColorSpace(Pe.copy(this),e);const n=Pe.r,s=Pe.g,r=Pe.b,o=Math.max(n,s,r),a=Math.min(n,s,r);let l,c;const h=(a+o)/2;if(a===o)l=0,c=0;else{const f=o-a;switch(c=h<=.5?f/(o+a):f/(2-o-a),o){case n:l=(s-r)/f+(s<r?6:0);break;case s:l=(r-n)/f+2;break;case r:l=(n-s)/f+4;break}l/=6}return t.h=l,t.s=c,t.l=h,t}getRGB(t,e=ne.workingColorSpace){return ne.fromWorkingColorSpace(Pe.copy(this),e),t.r=Pe.r,t.g=Pe.g,t.b=Pe.b,t}getStyle(t=Sn){ne.fromWorkingColorSpace(Pe.copy(this),t);const e=Pe.r,n=Pe.g,s=Pe.b;return t!==Sn?`color(${t} ${e.toFixed(3)} ${n.toFixed(3)} ${s.toFixed(3)})`:`rgb(${Math.round(e*255)},${Math.round(n*255)},${Math.round(s*255)})`}offsetHSL(t,e,n){return this.getHSL(Kn),this.setHSL(Kn.h+t,Kn.s+e,Kn.l+n)}add(t){return this.r+=t.r,this.g+=t.g,this.b+=t.b,this}addColors(t,e){return this.r=t.r+e.r,this.g=t.g+e.g,this.b=t.b+e.b,this}addScalar(t){return this.r+=t,this.g+=t,this.b+=t,this}sub(t){return this.r=Math.max(0,this.r-t.r),this.g=Math.max(0,this.g-t.g),this.b=Math.max(0,this.b-t.b),this}multiply(t){return this.r*=t.r,this.g*=t.g,this.b*=t.b,this}multiplyScalar(t){return this.r*=t,this.g*=t,this.b*=t,this}lerp(t,e){return this.r+=(t.r-this.r)*e,this.g+=(t.g-this.g)*e,this.b+=(t.b-this.b)*e,this}lerpColors(t,e,n){return this.r=t.r+(e.r-t.r)*n,this.g=t.g+(e.g-t.g)*n,this.b=t.b+(e.b-t.b)*n,this}lerpHSL(t,e){this.getHSL(Kn),t.getHSL(ur);const n=Ro(Kn.h,ur.h,e),s=Ro(Kn.s,ur.s,e),r=Ro(Kn.l,ur.l,e);return this.setHSL(n,s,r),this}setFromVector3(t){return this.r=t.x,this.g=t.y,this.b=t.z,this}applyMatrix3(t){const e=this.r,n=this.g,s=this.b,r=t.elements;return this.r=r[0]*e+r[3]*n+r[6]*s,this.g=r[1]*e+r[4]*n+r[7]*s,this.b=r[2]*e+r[5]*n+r[8]*s,this}equals(t){return t.r===this.r&&t.g===this.g&&t.b===this.b}fromArray(t,e=0){return this.r=t[e],this.g=t[e+1],this.b=t[e+2],this}toArray(t=[],e=0){return t[e]=this.r,t[e+1]=this.g,t[e+2]=this.b,t}fromBufferAttribute(t,e){return this.r=t.getX(e),this.g=t.getY(e),this.b=t.getZ(e),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}}const Pe=new jt;jt.NAMES=Lu;let Wf=0;class Ts extends Di{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:Wf++}),this.uuid=$s(),this.name="",this.type="Material",this.blending=ms,this.side=wn,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=Ma,this.blendDst=Sa,this.blendEquation=Ei,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new jt(0,0,0),this.blendAlpha=0,this.depthFunc=Jr,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=Cl,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=Fi,this.stencilZFail=Fi,this.stencilZPass=Fi,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(t){this._alphaTest>0!=t>0&&this.version++,this._alphaTest=t}onBuild(){}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(t){if(t!==void 0)for(const e in t){const n=t[e];if(n===void 0){console.warn(`THREE.Material: parameter '${e}' has value of undefined.`);continue}const s=this[e];if(s===void 0){console.warn(`THREE.Material: '${e}' is not a property of THREE.${this.type}.`);continue}s&&s.isColor?s.set(n):s&&s.isVector3&&n&&n.isVector3?s.copy(n):this[e]=n}}toJSON(t){const e=t===void 0||typeof t=="string";e&&(t={textures:{},images:{}});const n={metadata:{version:4.6,type:"Material",generator:"Material.toJSON"}};n.uuid=this.uuid,n.type=this.type,this.name!==""&&(n.name=this.name),this.color&&this.color.isColor&&(n.color=this.color.getHex()),this.roughness!==void 0&&(n.roughness=this.roughness),this.metalness!==void 0&&(n.metalness=this.metalness),this.sheen!==void 0&&(n.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(n.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(n.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(n.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&this.emissiveIntensity!==1&&(n.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(n.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(n.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(n.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(n.shininess=this.shininess),this.clearcoat!==void 0&&(n.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(n.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(n.clearcoatMap=this.clearcoatMap.toJSON(t).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(n.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(t).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(n.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(t).uuid,n.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.dispersion!==void 0&&(n.dispersion=this.dispersion),this.iridescence!==void 0&&(n.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(n.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(n.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(n.iridescenceMap=this.iridescenceMap.toJSON(t).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(n.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(t).uuid),this.anisotropy!==void 0&&(n.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(n.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(n.anisotropyMap=this.anisotropyMap.toJSON(t).uuid),this.map&&this.map.isTexture&&(n.map=this.map.toJSON(t).uuid),this.matcap&&this.matcap.isTexture&&(n.matcap=this.matcap.toJSON(t).uuid),this.alphaMap&&this.alphaMap.isTexture&&(n.alphaMap=this.alphaMap.toJSON(t).uuid),this.lightMap&&this.lightMap.isTexture&&(n.lightMap=this.lightMap.toJSON(t).uuid,n.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(n.aoMap=this.aoMap.toJSON(t).uuid,n.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(n.bumpMap=this.bumpMap.toJSON(t).uuid,n.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(n.normalMap=this.normalMap.toJSON(t).uuid,n.normalMapType=this.normalMapType,n.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(n.displacementMap=this.displacementMap.toJSON(t).uuid,n.displacementScale=this.displacementScale,n.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(n.roughnessMap=this.roughnessMap.toJSON(t).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(n.metalnessMap=this.metalnessMap.toJSON(t).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(n.emissiveMap=this.emissiveMap.toJSON(t).uuid),this.specularMap&&this.specularMap.isTexture&&(n.specularMap=this.specularMap.toJSON(t).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(n.specularIntensityMap=this.specularIntensityMap.toJSON(t).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(n.specularColorMap=this.specularColorMap.toJSON(t).uuid),this.envMap&&this.envMap.isTexture&&(n.envMap=this.envMap.toJSON(t).uuid,this.combine!==void 0&&(n.combine=this.combine)),this.envMapRotation!==void 0&&(n.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(n.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(n.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(n.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(n.gradientMap=this.gradientMap.toJSON(t).uuid),this.transmission!==void 0&&(n.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(n.transmissionMap=this.transmissionMap.toJSON(t).uuid),this.thickness!==void 0&&(n.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(n.thicknessMap=this.thicknessMap.toJSON(t).uuid),this.attenuationDistance!==void 0&&this.attenuationDistance!==1/0&&(n.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(n.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(n.size=this.size),this.shadowSide!==null&&(n.shadowSide=this.shadowSide),this.sizeAttenuation!==void 0&&(n.sizeAttenuation=this.sizeAttenuation),this.blending!==ms&&(n.blending=this.blending),this.side!==wn&&(n.side=this.side),this.vertexColors===!0&&(n.vertexColors=!0),this.opacity<1&&(n.opacity=this.opacity),this.transparent===!0&&(n.transparent=!0),this.blendSrc!==Ma&&(n.blendSrc=this.blendSrc),this.blendDst!==Sa&&(n.blendDst=this.blendDst),this.blendEquation!==Ei&&(n.blendEquation=this.blendEquation),this.blendSrcAlpha!==null&&(n.blendSrcAlpha=this.blendSrcAlpha),this.blendDstAlpha!==null&&(n.blendDstAlpha=this.blendDstAlpha),this.blendEquationAlpha!==null&&(n.blendEquationAlpha=this.blendEquationAlpha),this.blendColor&&this.blendColor.isColor&&(n.blendColor=this.blendColor.getHex()),this.blendAlpha!==0&&(n.blendAlpha=this.blendAlpha),this.depthFunc!==Jr&&(n.depthFunc=this.depthFunc),this.depthTest===!1&&(n.depthTest=this.depthTest),this.depthWrite===!1&&(n.depthWrite=this.depthWrite),this.colorWrite===!1&&(n.colorWrite=this.colorWrite),this.stencilWriteMask!==255&&(n.stencilWriteMask=this.stencilWriteMask),this.stencilFunc!==Cl&&(n.stencilFunc=this.stencilFunc),this.stencilRef!==0&&(n.stencilRef=this.stencilRef),this.stencilFuncMask!==255&&(n.stencilFuncMask=this.stencilFuncMask),this.stencilFail!==Fi&&(n.stencilFail=this.stencilFail),this.stencilZFail!==Fi&&(n.stencilZFail=this.stencilZFail),this.stencilZPass!==Fi&&(n.stencilZPass=this.stencilZPass),this.stencilWrite===!0&&(n.stencilWrite=this.stencilWrite),this.rotation!==void 0&&this.rotation!==0&&(n.rotation=this.rotation),this.polygonOffset===!0&&(n.polygonOffset=!0),this.polygonOffsetFactor!==0&&(n.polygonOffsetFactor=this.polygonOffsetFactor),this.polygonOffsetUnits!==0&&(n.polygonOffsetUnits=this.polygonOffsetUnits),this.linewidth!==void 0&&this.linewidth!==1&&(n.linewidth=this.linewidth),this.dashSize!==void 0&&(n.dashSize=this.dashSize),this.gapSize!==void 0&&(n.gapSize=this.gapSize),this.scale!==void 0&&(n.scale=this.scale),this.dithering===!0&&(n.dithering=!0),this.alphaTest>0&&(n.alphaTest=this.alphaTest),this.alphaHash===!0&&(n.alphaHash=!0),this.alphaToCoverage===!0&&(n.alphaToCoverage=!0),this.premultipliedAlpha===!0&&(n.premultipliedAlpha=!0),this.forceSinglePass===!0&&(n.forceSinglePass=!0),this.wireframe===!0&&(n.wireframe=!0),this.wireframeLinewidth>1&&(n.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!=="round"&&(n.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!=="round"&&(n.wireframeLinejoin=this.wireframeLinejoin),this.flatShading===!0&&(n.flatShading=!0),this.visible===!1&&(n.visible=!1),this.toneMapped===!1&&(n.toneMapped=!1),this.fog===!1&&(n.fog=!1),Object.keys(this.userData).length>0&&(n.userData=this.userData);function s(r){const o=[];for(const a in r){const l=r[a];delete l.metadata,o.push(l)}return o}if(e){const r=s(t.textures),o=s(t.images);r.length>0&&(n.textures=r),o.length>0&&(n.images=o)}return n}clone(){return new this.constructor().copy(this)}copy(t){this.name=t.name,this.blending=t.blending,this.side=t.side,this.vertexColors=t.vertexColors,this.opacity=t.opacity,this.transparent=t.transparent,this.blendSrc=t.blendSrc,this.blendDst=t.blendDst,this.blendEquation=t.blendEquation,this.blendSrcAlpha=t.blendSrcAlpha,this.blendDstAlpha=t.blendDstAlpha,this.blendEquationAlpha=t.blendEquationAlpha,this.blendColor.copy(t.blendColor),this.blendAlpha=t.blendAlpha,this.depthFunc=t.depthFunc,this.depthTest=t.depthTest,this.depthWrite=t.depthWrite,this.stencilWriteMask=t.stencilWriteMask,this.stencilFunc=t.stencilFunc,this.stencilRef=t.stencilRef,this.stencilFuncMask=t.stencilFuncMask,this.stencilFail=t.stencilFail,this.stencilZFail=t.stencilZFail,this.stencilZPass=t.stencilZPass,this.stencilWrite=t.stencilWrite;const e=t.clippingPlanes;let n=null;if(e!==null){const s=e.length;n=new Array(s);for(let r=0;r!==s;++r)n[r]=e[r].clone()}return this.clippingPlanes=n,this.clipIntersection=t.clipIntersection,this.clipShadows=t.clipShadows,this.shadowSide=t.shadowSide,this.colorWrite=t.colorWrite,this.precision=t.precision,this.polygonOffset=t.polygonOffset,this.polygonOffsetFactor=t.polygonOffsetFactor,this.polygonOffsetUnits=t.polygonOffsetUnits,this.dithering=t.dithering,this.alphaTest=t.alphaTest,this.alphaHash=t.alphaHash,this.alphaToCoverage=t.alphaToCoverage,this.premultipliedAlpha=t.premultipliedAlpha,this.forceSinglePass=t.forceSinglePass,this.visible=t.visible,this.toneMapped=t.toneMapped,this.userData=JSON.parse(JSON.stringify(t.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(t){t===!0&&this.version++}}class Du extends Ts{constructor(t){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new jt(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Rn,this.combine=ka,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.specularMap=t.specularMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.envMapRotation.copy(t.envMapRotation),this.combine=t.combine,this.reflectivity=t.reflectivity,this.refractionRatio=t.refractionRatio,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.fog=t.fog,this}}const ge=new I,hr=new At;class Je{constructor(t,e,n=!1){if(Array.isArray(t))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,this.name="",this.array=t,this.itemSize=e,this.count=t!==void 0?t.length/e:0,this.normalized=n,this.usage=Pl,this._updateRange={offset:0,count:-1},this.updateRanges=[],this.gpuType=ni,this.version=0}onUploadCallback(){}set needsUpdate(t){t===!0&&this.version++}get updateRange(){return Ru("THREE.BufferAttribute: updateRange() is deprecated and will be removed in r169. Use addUpdateRange() instead."),this._updateRange}setUsage(t){return this.usage=t,this}addUpdateRange(t,e){this.updateRanges.push({start:t,count:e})}clearUpdateRanges(){this.updateRanges.length=0}copy(t){return this.name=t.name,this.array=new t.array.constructor(t.array),this.itemSize=t.itemSize,this.count=t.count,this.normalized=t.normalized,this.usage=t.usage,this.gpuType=t.gpuType,this}copyAt(t,e,n){t*=this.itemSize,n*=e.itemSize;for(let s=0,r=this.itemSize;s<r;s++)this.array[t+s]=e.array[n+s];return this}copyArray(t){return this.array.set(t),this}applyMatrix3(t){if(this.itemSize===2)for(let e=0,n=this.count;e<n;e++)hr.fromBufferAttribute(this,e),hr.applyMatrix3(t),this.setXY(e,hr.x,hr.y);else if(this.itemSize===3)for(let e=0,n=this.count;e<n;e++)ge.fromBufferAttribute(this,e),ge.applyMatrix3(t),this.setXYZ(e,ge.x,ge.y,ge.z);return this}applyMatrix4(t){for(let e=0,n=this.count;e<n;e++)ge.fromBufferAttribute(this,e),ge.applyMatrix4(t),this.setXYZ(e,ge.x,ge.y,ge.z);return this}applyNormalMatrix(t){for(let e=0,n=this.count;e<n;e++)ge.fromBufferAttribute(this,e),ge.applyNormalMatrix(t),this.setXYZ(e,ge.x,ge.y,ge.z);return this}transformDirection(t){for(let e=0,n=this.count;e<n;e++)ge.fromBufferAttribute(this,e),ge.transformDirection(t),this.setXYZ(e,ge.x,ge.y,ge.z);return this}set(t,e=0){return this.array.set(t,e),this}getComponent(t,e){let n=this.array[t*this.itemSize+e];return this.normalized&&(n=ws(n,this.array)),n}setComponent(t,e,n){return this.normalized&&(n=Be(n,this.array)),this.array[t*this.itemSize+e]=n,this}getX(t){let e=this.array[t*this.itemSize];return this.normalized&&(e=ws(e,this.array)),e}setX(t,e){return this.normalized&&(e=Be(e,this.array)),this.array[t*this.itemSize]=e,this}getY(t){let e=this.array[t*this.itemSize+1];return this.normalized&&(e=ws(e,this.array)),e}setY(t,e){return this.normalized&&(e=Be(e,this.array)),this.array[t*this.itemSize+1]=e,this}getZ(t){let e=this.array[t*this.itemSize+2];return this.normalized&&(e=ws(e,this.array)),e}setZ(t,e){return this.normalized&&(e=Be(e,this.array)),this.array[t*this.itemSize+2]=e,this}getW(t){let e=this.array[t*this.itemSize+3];return this.normalized&&(e=ws(e,this.array)),e}setW(t,e){return this.normalized&&(e=Be(e,this.array)),this.array[t*this.itemSize+3]=e,this}setXY(t,e,n){return t*=this.itemSize,this.normalized&&(e=Be(e,this.array),n=Be(n,this.array)),this.array[t+0]=e,this.array[t+1]=n,this}setXYZ(t,e,n,s){return t*=this.itemSize,this.normalized&&(e=Be(e,this.array),n=Be(n,this.array),s=Be(s,this.array)),this.array[t+0]=e,this.array[t+1]=n,this.array[t+2]=s,this}setXYZW(t,e,n,s,r){return t*=this.itemSize,this.normalized&&(e=Be(e,this.array),n=Be(n,this.array),s=Be(s,this.array),r=Be(r,this.array)),this.array[t+0]=e,this.array[t+1]=n,this.array[t+2]=s,this.array[t+3]=r,this}onUpload(t){return this.onUploadCallback=t,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){const t={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return this.name!==""&&(t.name=this.name),this.usage!==Pl&&(t.usage=this.usage),t}}class Uu extends Je{constructor(t,e,n){super(new Uint16Array(t),e,n)}}class Iu extends Je{constructor(t,e,n){super(new Uint32Array(t),e,n)}}class Ve extends Je{constructor(t,e,n){super(new Float32Array(t),e,n)}}let Xf=0;const en=new Kt,Wo=new Ae,qi=new I,je=new Oe,Ls=new Oe,ye=new I;class We extends Di{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:Xf++}),this.uuid=$s(),this.name="",this.type="BufferGeometry",this.index=null,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={}}getIndex(){return this.index}setIndex(t){return Array.isArray(t)?this.index=new(wu(t)?Iu:Uu)(t,1):this.index=t,this}getAttribute(t){return this.attributes[t]}setAttribute(t,e){return this.attributes[t]=e,this}deleteAttribute(t){return delete this.attributes[t],this}hasAttribute(t){return this.attributes[t]!==void 0}addGroup(t,e,n=0){this.groups.push({start:t,count:e,materialIndex:n})}clearGroups(){this.groups=[]}setDrawRange(t,e){this.drawRange.start=t,this.drawRange.count=e}applyMatrix4(t){const e=this.attributes.position;e!==void 0&&(e.applyMatrix4(t),e.needsUpdate=!0);const n=this.attributes.normal;if(n!==void 0){const r=new Vt().getNormalMatrix(t);n.applyNormalMatrix(r),n.needsUpdate=!0}const s=this.attributes.tangent;return s!==void 0&&(s.transformDirection(t),s.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this}applyQuaternion(t){return en.makeRotationFromQuaternion(t),this.applyMatrix4(en),this}rotateX(t){return en.makeRotationX(t),this.applyMatrix4(en),this}rotateY(t){return en.makeRotationY(t),this.applyMatrix4(en),this}rotateZ(t){return en.makeRotationZ(t),this.applyMatrix4(en),this}translate(t,e,n){return en.makeTranslation(t,e,n),this.applyMatrix4(en),this}scale(t,e,n){return en.makeScale(t,e,n),this.applyMatrix4(en),this}lookAt(t){return Wo.lookAt(t),Wo.updateMatrix(),this.applyMatrix4(Wo.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(qi).negate(),this.translate(qi.x,qi.y,qi.z),this}setFromPoints(t){const e=[];for(let n=0,s=t.length;n<s;n++){const r=t[n];e.push(r.x,r.y,r.z||0)}return this.setAttribute("position",new Ve(e,3)),this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new Oe);const t=this.attributes.position,e=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new I(-1/0,-1/0,-1/0),new I(1/0,1/0,1/0));return}if(t!==void 0){if(this.boundingBox.setFromBufferAttribute(t),e)for(let n=0,s=e.length;n<s;n++){const r=e[n];je.setFromBufferAttribute(r),this.morphTargetsRelative?(ye.addVectors(this.boundingBox.min,je.min),this.boundingBox.expandByPoint(ye),ye.addVectors(this.boundingBox.max,je.max),this.boundingBox.expandByPoint(ye)):(this.boundingBox.expandByPoint(je.min),this.boundingBox.expandByPoint(je.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&console.error('THREE.BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new Zs);const t=this.attributes.position,e=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new I,1/0);return}if(t){const n=this.boundingSphere.center;if(je.setFromBufferAttribute(t),e)for(let r=0,o=e.length;r<o;r++){const a=e[r];Ls.setFromBufferAttribute(a),this.morphTargetsRelative?(ye.addVectors(je.min,Ls.min),je.expandByPoint(ye),ye.addVectors(je.max,Ls.max),je.expandByPoint(ye)):(je.expandByPoint(Ls.min),je.expandByPoint(Ls.max))}je.getCenter(n);let s=0;for(let r=0,o=t.count;r<o;r++)ye.fromBufferAttribute(t,r),s=Math.max(s,n.distanceToSquared(ye));if(e)for(let r=0,o=e.length;r<o;r++){const a=e[r],l=this.morphTargetsRelative;for(let c=0,h=a.count;c<h;c++)ye.fromBufferAttribute(a,c),l&&(qi.fromBufferAttribute(t,c),ye.add(qi)),s=Math.max(s,n.distanceToSquared(ye))}this.boundingSphere.radius=Math.sqrt(s),isNaN(this.boundingSphere.radius)&&console.error('THREE.BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){const t=this.index,e=this.attributes;if(t===null||e.position===void 0||e.normal===void 0||e.uv===void 0){console.error("THREE.BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}const n=e.position,s=e.normal,r=e.uv;this.hasAttribute("tangent")===!1&&this.setAttribute("tangent",new Je(new Float32Array(4*n.count),4));const o=this.getAttribute("tangent"),a=[],l=[];for(let P=0;P<n.count;P++)a[P]=new I,l[P]=new I;const c=new I,h=new I,f=new I,u=new At,d=new At,g=new At,_=new I,m=new I;function p(P,T,v){c.fromBufferAttribute(n,P),h.fromBufferAttribute(n,T),f.fromBufferAttribute(n,v),u.fromBufferAttribute(r,P),d.fromBufferAttribute(r,T),g.fromBufferAttribute(r,v),h.sub(c),f.sub(c),d.sub(u),g.sub(u);const R=1/(d.x*g.y-g.x*d.y);isFinite(R)&&(_.copy(h).multiplyScalar(g.y).addScaledVector(f,-d.y).multiplyScalar(R),m.copy(f).multiplyScalar(d.x).addScaledVector(h,-g.x).multiplyScalar(R),a[P].add(_),a[T].add(_),a[v].add(_),l[P].add(m),l[T].add(m),l[v].add(m))}let M=this.groups;M.length===0&&(M=[{start:0,count:t.count}]);for(let P=0,T=M.length;P<T;++P){const v=M[P],R=v.start,L=v.count;for(let D=R,N=R+L;D<N;D+=3)p(t.getX(D+0),t.getX(D+1),t.getX(D+2))}const x=new I,E=new I,A=new I,b=new I;function S(P){A.fromBufferAttribute(s,P),b.copy(A);const T=a[P];x.copy(T),x.sub(A.multiplyScalar(A.dot(T))).normalize(),E.crossVectors(b,T);const R=E.dot(l[P])<0?-1:1;o.setXYZW(P,x.x,x.y,x.z,R)}for(let P=0,T=M.length;P<T;++P){const v=M[P],R=v.start,L=v.count;for(let D=R,N=R+L;D<N;D+=3)S(t.getX(D+0)),S(t.getX(D+1)),S(t.getX(D+2))}}computeVertexNormals(){const t=this.index,e=this.getAttribute("position");if(e!==void 0){let n=this.getAttribute("normal");if(n===void 0)n=new Je(new Float32Array(e.count*3),3),this.setAttribute("normal",n);else for(let u=0,d=n.count;u<d;u++)n.setXYZ(u,0,0,0);const s=new I,r=new I,o=new I,a=new I,l=new I,c=new I,h=new I,f=new I;if(t)for(let u=0,d=t.count;u<d;u+=3){const g=t.getX(u+0),_=t.getX(u+1),m=t.getX(u+2);s.fromBufferAttribute(e,g),r.fromBufferAttribute(e,_),o.fromBufferAttribute(e,m),h.subVectors(o,r),f.subVectors(s,r),h.cross(f),a.fromBufferAttribute(n,g),l.fromBufferAttribute(n,_),c.fromBufferAttribute(n,m),a.add(h),l.add(h),c.add(h),n.setXYZ(g,a.x,a.y,a.z),n.setXYZ(_,l.x,l.y,l.z),n.setXYZ(m,c.x,c.y,c.z)}else for(let u=0,d=e.count;u<d;u+=3)s.fromBufferAttribute(e,u+0),r.fromBufferAttribute(e,u+1),o.fromBufferAttribute(e,u+2),h.subVectors(o,r),f.subVectors(s,r),h.cross(f),n.setXYZ(u+0,h.x,h.y,h.z),n.setXYZ(u+1,h.x,h.y,h.z),n.setXYZ(u+2,h.x,h.y,h.z);this.normalizeNormals(),n.needsUpdate=!0}}normalizeNormals(){const t=this.attributes.normal;for(let e=0,n=t.count;e<n;e++)ye.fromBufferAttribute(t,e),ye.normalize(),t.setXYZ(e,ye.x,ye.y,ye.z)}toNonIndexed(){function t(a,l){const c=a.array,h=a.itemSize,f=a.normalized,u=new c.constructor(l.length*h);let d=0,g=0;for(let _=0,m=l.length;_<m;_++){a.isInterleavedBufferAttribute?d=l[_]*a.data.stride+a.offset:d=l[_]*h;for(let p=0;p<h;p++)u[g++]=c[d++]}return new Je(u,h,f)}if(this.index===null)return console.warn("THREE.BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;const e=new We,n=this.index.array,s=this.attributes;for(const a in s){const l=s[a],c=t(l,n);e.setAttribute(a,c)}const r=this.morphAttributes;for(const a in r){const l=[],c=r[a];for(let h=0,f=c.length;h<f;h++){const u=c[h],d=t(u,n);l.push(d)}e.morphAttributes[a]=l}e.morphTargetsRelative=this.morphTargetsRelative;const o=this.groups;for(let a=0,l=o.length;a<l;a++){const c=o[a];e.addGroup(c.start,c.count,c.materialIndex)}return e}toJSON(){const t={metadata:{version:4.6,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(t.uuid=this.uuid,t.type=this.type,this.name!==""&&(t.name=this.name),Object.keys(this.userData).length>0&&(t.userData=this.userData),this.parameters!==void 0){const l=this.parameters;for(const c in l)l[c]!==void 0&&(t[c]=l[c]);return t}t.data={attributes:{}};const e=this.index;e!==null&&(t.data.index={type:e.array.constructor.name,array:Array.prototype.slice.call(e.array)});const n=this.attributes;for(const l in n){const c=n[l];t.data.attributes[l]=c.toJSON(t.data)}const s={};let r=!1;for(const l in this.morphAttributes){const c=this.morphAttributes[l],h=[];for(let f=0,u=c.length;f<u;f++){const d=c[f];h.push(d.toJSON(t.data))}h.length>0&&(s[l]=h,r=!0)}r&&(t.data.morphAttributes=s,t.data.morphTargetsRelative=this.morphTargetsRelative);const o=this.groups;o.length>0&&(t.data.groups=JSON.parse(JSON.stringify(o)));const a=this.boundingSphere;return a!==null&&(t.data.boundingSphere={center:a.center.toArray(),radius:a.radius}),t}clone(){return new this.constructor().copy(this)}copy(t){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;const e={};this.name=t.name;const n=t.index;n!==null&&this.setIndex(n.clone(e));const s=t.attributes;for(const c in s){const h=s[c];this.setAttribute(c,h.clone(e))}const r=t.morphAttributes;for(const c in r){const h=[],f=r[c];for(let u=0,d=f.length;u<d;u++)h.push(f[u].clone(e));this.morphAttributes[c]=h}this.morphTargetsRelative=t.morphTargetsRelative;const o=t.groups;for(let c=0,h=o.length;c<h;c++){const f=o[c];this.addGroup(f.start,f.count,f.materialIndex)}const a=t.boundingBox;a!==null&&(this.boundingBox=a.clone());const l=t.boundingSphere;return l!==null&&(this.boundingSphere=l.clone()),this.drawRange.start=t.drawRange.start,this.drawRange.count=t.drawRange.count,this.userData=t.userData,this}dispose(){this.dispatchEvent({type:"dispose"})}}const Wl=new Kt,_i=new Js,fr=new Zs,Xl=new I,Yi=new I,ji=new I,Ki=new I,Xo=new I,dr=new I,pr=new At,mr=new At,gr=new At,ql=new I,Yl=new I,jl=new I,_r=new I,xr=new I;class me extends Ae{constructor(t=new We,e=new Du){super(),this.isMesh=!0,this.type="Mesh",this.geometry=t,this.material=e,this.updateMorphTargets()}copy(t,e){return super.copy(t,e),t.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=t.morphTargetInfluences.slice()),t.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},t.morphTargetDictionary)),this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}updateMorphTargets(){const e=this.geometry.morphAttributes,n=Object.keys(e);if(n.length>0){const s=e[n[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,o=s.length;r<o;r++){const a=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=r}}}}getVertexPosition(t,e){const n=this.geometry,s=n.attributes.position,r=n.morphAttributes.position,o=n.morphTargetsRelative;e.fromBufferAttribute(s,t);const a=this.morphTargetInfluences;if(r&&a){dr.set(0,0,0);for(let l=0,c=r.length;l<c;l++){const h=a[l],f=r[l];h!==0&&(Xo.fromBufferAttribute(f,t),o?dr.addScaledVector(Xo,h):dr.addScaledVector(Xo.sub(e),h))}e.add(dr)}return e}raycast(t,e){const n=this.geometry,s=this.material,r=this.matrixWorld;s!==void 0&&(n.boundingSphere===null&&n.computeBoundingSphere(),fr.copy(n.boundingSphere),fr.applyMatrix4(r),_i.copy(t.ray).recast(t.near),!(fr.containsPoint(_i.origin)===!1&&(_i.intersectSphere(fr,Xl)===null||_i.origin.distanceToSquared(Xl)>(t.far-t.near)**2))&&(Wl.copy(r).invert(),_i.copy(t.ray).applyMatrix4(Wl),!(n.boundingBox!==null&&_i.intersectsBox(n.boundingBox)===!1)&&this._computeIntersections(t,e,_i)))}_computeIntersections(t,e,n){let s;const r=this.geometry,o=this.material,a=r.index,l=r.attributes.position,c=r.attributes.uv,h=r.attributes.uv1,f=r.attributes.normal,u=r.groups,d=r.drawRange;if(a!==null)if(Array.isArray(o))for(let g=0,_=u.length;g<_;g++){const m=u[g],p=o[m.materialIndex],M=Math.max(m.start,d.start),x=Math.min(a.count,Math.min(m.start+m.count,d.start+d.count));for(let E=M,A=x;E<A;E+=3){const b=a.getX(E),S=a.getX(E+1),P=a.getX(E+2);s=vr(this,p,t,n,c,h,f,b,S,P),s&&(s.faceIndex=Math.floor(E/3),s.face.materialIndex=m.materialIndex,e.push(s))}}else{const g=Math.max(0,d.start),_=Math.min(a.count,d.start+d.count);for(let m=g,p=_;m<p;m+=3){const M=a.getX(m),x=a.getX(m+1),E=a.getX(m+2);s=vr(this,o,t,n,c,h,f,M,x,E),s&&(s.faceIndex=Math.floor(m/3),e.push(s))}}else if(l!==void 0)if(Array.isArray(o))for(let g=0,_=u.length;g<_;g++){const m=u[g],p=o[m.materialIndex],M=Math.max(m.start,d.start),x=Math.min(l.count,Math.min(m.start+m.count,d.start+d.count));for(let E=M,A=x;E<A;E+=3){const b=E,S=E+1,P=E+2;s=vr(this,p,t,n,c,h,f,b,S,P),s&&(s.faceIndex=Math.floor(E/3),s.face.materialIndex=m.materialIndex,e.push(s))}}else{const g=Math.max(0,d.start),_=Math.min(l.count,d.start+d.count);for(let m=g,p=_;m<p;m+=3){const M=m,x=m+1,E=m+2;s=vr(this,o,t,n,c,h,f,M,x,E),s&&(s.faceIndex=Math.floor(m/3),e.push(s))}}}}function qf(i,t,e,n,s,r,o,a){let l;if(t.side===Fe?l=n.intersectTriangle(o,r,s,!0,a):l=n.intersectTriangle(s,r,o,t.side===wn,a),l===null)return null;xr.copy(a),xr.applyMatrix4(i.matrixWorld);const c=e.ray.origin.distanceTo(xr);return c<e.near||c>e.far?null:{distance:c,point:xr.clone(),object:i}}function vr(i,t,e,n,s,r,o,a,l,c){i.getVertexPosition(a,Yi),i.getVertexPosition(l,ji),i.getVertexPosition(c,Ki);const h=qf(i,t,e,n,Yi,ji,Ki,_r);if(h){s&&(pr.fromBufferAttribute(s,a),mr.fromBufferAttribute(s,l),gr.fromBufferAttribute(s,c),h.uv=Ne.getInterpolation(_r,Yi,ji,Ki,pr,mr,gr,new At)),r&&(pr.fromBufferAttribute(r,a),mr.fromBufferAttribute(r,l),gr.fromBufferAttribute(r,c),h.uv1=Ne.getInterpolation(_r,Yi,ji,Ki,pr,mr,gr,new At)),o&&(ql.fromBufferAttribute(o,a),Yl.fromBufferAttribute(o,l),jl.fromBufferAttribute(o,c),h.normal=Ne.getInterpolation(_r,Yi,ji,Ki,ql,Yl,jl,new I),h.normal.dot(n.direction)>0&&h.normal.multiplyScalar(-1));const f={a,b:l,c,normal:new I,materialIndex:0};Ne.getNormal(Yi,ji,Ki,f.normal),h.face=f}return h}class Cn extends We{constructor(t=1,e=1,n=1,s=1,r=1,o=1){super(),this.type="BoxGeometry",this.parameters={width:t,height:e,depth:n,widthSegments:s,heightSegments:r,depthSegments:o};const a=this;s=Math.floor(s),r=Math.floor(r),o=Math.floor(o);const l=[],c=[],h=[],f=[];let u=0,d=0;g("z","y","x",-1,-1,n,e,t,o,r,0),g("z","y","x",1,-1,n,e,-t,o,r,1),g("x","z","y",1,1,t,n,e,s,o,2),g("x","z","y",1,-1,t,n,-e,s,o,3),g("x","y","z",1,-1,t,e,n,s,r,4),g("x","y","z",-1,-1,t,e,-n,s,r,5),this.setIndex(l),this.setAttribute("position",new Ve(c,3)),this.setAttribute("normal",new Ve(h,3)),this.setAttribute("uv",new Ve(f,2));function g(_,m,p,M,x,E,A,b,S,P,T){const v=E/S,R=A/P,L=E/2,D=A/2,N=b/2,z=S+1,O=P+1;let Y=0,B=0;const it=new I;for(let st=0;st<O;st++){const ht=st*R-D;for(let Pt=0;Pt<z;Pt++){const Wt=Pt*v-L;it[_]=Wt*M,it[m]=ht*x,it[p]=N,c.push(it.x,it.y,it.z),it[_]=0,it[m]=0,it[p]=b>0?1:-1,h.push(it.x,it.y,it.z),f.push(Pt/S),f.push(1-st/P),Y+=1}}for(let st=0;st<P;st++)for(let ht=0;ht<S;ht++){const Pt=u+ht+z*st,Wt=u+ht+z*(st+1),K=u+(ht+1)+z*(st+1),et=u+(ht+1)+z*st;l.push(Pt,Wt,et),l.push(Wt,K,et),B+=6}a.addGroup(d,B,T),d+=B,u+=Y}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new Cn(t.width,t.height,t.depth,t.widthSegments,t.heightSegments,t.depthSegments)}}function Es(i){const t={};for(const e in i){t[e]={};for(const n in i[e]){const s=i[e][n];s&&(s.isColor||s.isMatrix3||s.isMatrix4||s.isVector2||s.isVector3||s.isVector4||s.isTexture||s.isQuaternion)?s.isRenderTargetTexture?(console.warn("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),t[e][n]=null):t[e][n]=s.clone():Array.isArray(s)?t[e][n]=s.slice():t[e][n]=s}}return t}function Ie(i){const t={};for(let e=0;e<i.length;e++){const n=Es(i[e]);for(const s in n)t[s]=n[s]}return t}function Yf(i){const t=[];for(let e=0;e<i.length;e++)t.push(i[e].clone());return t}function Nu(i){const t=i.getRenderTarget();return t===null?i.outputColorSpace:t.isXRRenderTarget===!0?t.texture.colorSpace:ne.workingColorSpace}const jf={clone:Es,merge:Ie};var Kf=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,$f=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`;class ci extends Ts{constructor(t){super(),this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=Kf,this.fragmentShader=$f,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,t!==void 0&&this.setValues(t)}copy(t){return super.copy(t),this.fragmentShader=t.fragmentShader,this.vertexShader=t.vertexShader,this.uniforms=Es(t.uniforms),this.uniformsGroups=Yf(t.uniformsGroups),this.defines=Object.assign({},t.defines),this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.fog=t.fog,this.lights=t.lights,this.clipping=t.clipping,this.extensions=Object.assign({},t.extensions),this.glslVersion=t.glslVersion,this}toJSON(t){const e=super.toJSON(t);e.glslVersion=this.glslVersion,e.uniforms={};for(const s in this.uniforms){const o=this.uniforms[s].value;o&&o.isTexture?e.uniforms[s]={type:"t",value:o.toJSON(t).uuid}:o&&o.isColor?e.uniforms[s]={type:"c",value:o.getHex()}:o&&o.isVector2?e.uniforms[s]={type:"v2",value:o.toArray()}:o&&o.isVector3?e.uniforms[s]={type:"v3",value:o.toArray()}:o&&o.isVector4?e.uniforms[s]={type:"v4",value:o.toArray()}:o&&o.isMatrix3?e.uniforms[s]={type:"m3",value:o.toArray()}:o&&o.isMatrix4?e.uniforms[s]={type:"m4",value:o.toArray()}:e.uniforms[s]={value:o}}Object.keys(this.defines).length>0&&(e.defines=this.defines),e.vertexShader=this.vertexShader,e.fragmentShader=this.fragmentShader,e.lights=this.lights,e.clipping=this.clipping;const n={};for(const s in this.extensions)this.extensions[s]===!0&&(n[s]=!0);return Object.keys(n).length>0&&(e.extensions=n),e}}class Fu extends Ae{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new Kt,this.projectionMatrix=new Kt,this.projectionMatrixInverse=new Kt,this.coordinateSystem=kn}copy(t,e){return super.copy(t,e),this.matrixWorldInverse.copy(t.matrixWorldInverse),this.projectionMatrix.copy(t.projectionMatrix),this.projectionMatrixInverse.copy(t.projectionMatrixInverse),this.coordinateSystem=t.coordinateSystem,this}getWorldDirection(t){return super.getWorldDirection(t).negate()}updateMatrixWorld(t){super.updateMatrixWorld(t),this.matrixWorldInverse.copy(this.matrixWorld).invert()}updateWorldMatrix(t,e){super.updateWorldMatrix(t,e),this.matrixWorldInverse.copy(this.matrixWorld).invert()}clone(){return new this.constructor().copy(this)}}const $n=new I,Kl=new At,$l=new At;class sn extends Fu{constructor(t=50,e=1,n=.1,s=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=t,this.zoom=1,this.near=n,this.far=s,this.focus=10,this.aspect=e,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(t,e){return super.copy(t,e),this.fov=t.fov,this.zoom=t.zoom,this.near=t.near,this.far=t.far,this.focus=t.focus,this.aspect=t.aspect,this.view=t.view===null?null:Object.assign({},t.view),this.filmGauge=t.filmGauge,this.filmOffset=t.filmOffset,this}setFocalLength(t){const e=.5*this.getFilmHeight()/t;this.fov=Aa*2*Math.atan(e),this.updateProjectionMatrix()}getFocalLength(){const t=Math.tan(Vr*.5*this.fov);return .5*this.getFilmHeight()/t}getEffectiveFOV(){return Aa*2*Math.atan(Math.tan(Vr*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(t,e,n){$n.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),e.set($n.x,$n.y).multiplyScalar(-t/$n.z),$n.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),n.set($n.x,$n.y).multiplyScalar(-t/$n.z)}getViewSize(t,e){return this.getViewBounds(t,Kl,$l),e.subVectors($l,Kl)}setViewOffset(t,e,n,s,r,o){this.aspect=t/e,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=t,this.view.fullHeight=e,this.view.offsetX=n,this.view.offsetY=s,this.view.width=r,this.view.height=o,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const t=this.near;let e=t*Math.tan(Vr*.5*this.fov)/this.zoom,n=2*e,s=this.aspect*n,r=-.5*s;const o=this.view;if(this.view!==null&&this.view.enabled){const l=o.fullWidth,c=o.fullHeight;r+=o.offsetX*s/l,e-=o.offsetY*n/c,s*=o.width/l,n*=o.height/c}const a=this.filmOffset;a!==0&&(r+=t*a/this.getFilmWidth()),this.projectionMatrix.makePerspective(r,r+s,e,e-n,t,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(t){const e=super.toJSON(t);return e.object.fov=this.fov,e.object.zoom=this.zoom,e.object.near=this.near,e.object.far=this.far,e.object.focus=this.focus,e.object.aspect=this.aspect,this.view!==null&&(e.object.view=Object.assign({},this.view)),e.object.filmGauge=this.filmGauge,e.object.filmOffset=this.filmOffset,e}}const $i=-90,Zi=1;class Zf extends Ae{constructor(t,e,n){super(),this.type="CubeCamera",this.renderTarget=n,this.coordinateSystem=null,this.activeMipmapLevel=0;const s=new sn($i,Zi,t,e);s.layers=this.layers,this.add(s);const r=new sn($i,Zi,t,e);r.layers=this.layers,this.add(r);const o=new sn($i,Zi,t,e);o.layers=this.layers,this.add(o);const a=new sn($i,Zi,t,e);a.layers=this.layers,this.add(a);const l=new sn($i,Zi,t,e);l.layers=this.layers,this.add(l);const c=new sn($i,Zi,t,e);c.layers=this.layers,this.add(c)}updateCoordinateSystem(){const t=this.coordinateSystem,e=this.children.concat(),[n,s,r,o,a,l]=e;for(const c of e)this.remove(c);if(t===kn)n.up.set(0,1,0),n.lookAt(1,0,0),s.up.set(0,1,0),s.lookAt(-1,0,0),r.up.set(0,0,-1),r.lookAt(0,1,0),o.up.set(0,0,1),o.lookAt(0,-1,0),a.up.set(0,1,0),a.lookAt(0,0,1),l.up.set(0,1,0),l.lookAt(0,0,-1);else if(t===io)n.up.set(0,-1,0),n.lookAt(-1,0,0),s.up.set(0,-1,0),s.lookAt(1,0,0),r.up.set(0,0,1),r.lookAt(0,1,0),o.up.set(0,0,-1),o.lookAt(0,-1,0),a.up.set(0,-1,0),a.lookAt(0,0,1),l.up.set(0,-1,0),l.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+t);for(const c of e)this.add(c),c.updateMatrixWorld()}update(t,e){this.parent===null&&this.updateMatrixWorld();const{renderTarget:n,activeMipmapLevel:s}=this;this.coordinateSystem!==t.coordinateSystem&&(this.coordinateSystem=t.coordinateSystem,this.updateCoordinateSystem());const[r,o,a,l,c,h]=this.children,f=t.getRenderTarget(),u=t.getActiveCubeFace(),d=t.getActiveMipmapLevel(),g=t.xr.enabled;t.xr.enabled=!1;const _=n.texture.generateMipmaps;n.texture.generateMipmaps=!1,t.setRenderTarget(n,0,s),t.render(e,r),t.setRenderTarget(n,1,s),t.render(e,o),t.setRenderTarget(n,2,s),t.render(e,a),t.setRenderTarget(n,3,s),t.render(e,l),t.setRenderTarget(n,4,s),t.render(e,c),n.texture.generateMipmaps=_,t.setRenderTarget(n,5,s),t.render(e,h),t.setRenderTarget(f,u,d),t.xr.enabled=g,n.texture.needsPMREMUpdate=!0}}class Ou extends Ge{constructor(t,e,n,s,r,o,a,l,c,h){t=t!==void 0?t:[],e=e!==void 0?e:xs,super(t,e,n,s,r,o,a,l,c,h),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(t){this.image=t}}class Jf extends Ri{constructor(t=1,e={}){super(t,t,e),this.isWebGLCubeRenderTarget=!0;const n={width:t,height:t,depth:1},s=[n,n,n,n,n,n];this.texture=new Ou(s,e.mapping,e.wrapS,e.wrapT,e.magFilter,e.minFilter,e.format,e.type,e.anisotropy,e.colorSpace),this.texture.isRenderTargetTexture=!0,this.texture.generateMipmaps=e.generateMipmaps!==void 0?e.generateMipmaps:!1,this.texture.minFilter=e.minFilter!==void 0?e.minFilter:xn}fromEquirectangularTexture(t,e){this.texture.type=e.type,this.texture.colorSpace=e.colorSpace,this.texture.generateMipmaps=e.generateMipmaps,this.texture.minFilter=e.minFilter,this.texture.magFilter=e.magFilter;const n={uniforms:{tEquirect:{value:null}},vertexShader:`

				varying vec3 vWorldDirection;

				vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

					return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

				}

				void main() {

					vWorldDirection = transformDirection( position, modelMatrix );

					#include <begin_vertex>
					#include <project_vertex>

				}
			`,fragmentShader:`

				uniform sampler2D tEquirect;

				varying vec3 vWorldDirection;

				#include <common>

				void main() {

					vec3 direction = normalize( vWorldDirection );

					vec2 sampleUV = equirectUv( direction );

					gl_FragColor = texture2D( tEquirect, sampleUV );

				}
			`},s=new Cn(5,5,5),r=new ci({name:"CubemapFromEquirect",uniforms:Es(n.uniforms),vertexShader:n.vertexShader,fragmentShader:n.fragmentShader,side:Fe,blending:oi});r.uniforms.tEquirect.value=e;const o=new me(s,r),a=e.minFilter;return e.minFilter===wi&&(e.minFilter=xn),new Zf(1,10,this).update(t,o),e.minFilter=a,o.geometry.dispose(),o.material.dispose(),this}clear(t,e,n,s){const r=t.getRenderTarget();for(let o=0;o<6;o++)t.setRenderTarget(this,o),t.clear(e,n,s);t.setRenderTarget(r)}}const qo=new I,Qf=new I,td=new Vt;class _n{constructor(t=new I(1,0,0),e=0){this.isPlane=!0,this.normal=t,this.constant=e}set(t,e){return this.normal.copy(t),this.constant=e,this}setComponents(t,e,n,s){return this.normal.set(t,e,n),this.constant=s,this}setFromNormalAndCoplanarPoint(t,e){return this.normal.copy(t),this.constant=-e.dot(this.normal),this}setFromCoplanarPoints(t,e,n){const s=qo.subVectors(n,e).cross(Qf.subVectors(t,e)).normalize();return this.setFromNormalAndCoplanarPoint(s,t),this}copy(t){return this.normal.copy(t.normal),this.constant=t.constant,this}normalize(){const t=1/this.normal.length();return this.normal.multiplyScalar(t),this.constant*=t,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(t){return this.normal.dot(t)+this.constant}distanceToSphere(t){return this.distanceToPoint(t.center)-t.radius}projectPoint(t,e){return e.copy(t).addScaledVector(this.normal,-this.distanceToPoint(t))}intersectLine(t,e){const n=t.delta(qo),s=this.normal.dot(n);if(s===0)return this.distanceToPoint(t.start)===0?e.copy(t.start):null;const r=-(t.start.dot(this.normal)+this.constant)/s;return r<0||r>1?null:e.copy(t.start).addScaledVector(n,r)}intersectsLine(t){const e=this.distanceToPoint(t.start),n=this.distanceToPoint(t.end);return e<0&&n>0||n<0&&e>0}intersectsBox(t){return t.intersectsPlane(this)}intersectsSphere(t){return t.intersectsPlane(this)}coplanarPoint(t){return t.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(t,e){const n=e||td.getNormalMatrix(t),s=this.coplanarPoint(qo).applyMatrix4(t),r=this.normal.applyMatrix3(n).normalize();return this.constant=-s.dot(r),this}translate(t){return this.constant-=t.dot(this.normal),this}equals(t){return t.normal.equals(this.normal)&&t.constant===this.constant}clone(){return new this.constructor().copy(this)}}const xi=new Zs,Mr=new I;class Va{constructor(t=new _n,e=new _n,n=new _n,s=new _n,r=new _n,o=new _n){this.planes=[t,e,n,s,r,o]}set(t,e,n,s,r,o){const a=this.planes;return a[0].copy(t),a[1].copy(e),a[2].copy(n),a[3].copy(s),a[4].copy(r),a[5].copy(o),this}copy(t){const e=this.planes;for(let n=0;n<6;n++)e[n].copy(t.planes[n]);return this}setFromProjectionMatrix(t,e=kn){const n=this.planes,s=t.elements,r=s[0],o=s[1],a=s[2],l=s[3],c=s[4],h=s[5],f=s[6],u=s[7],d=s[8],g=s[9],_=s[10],m=s[11],p=s[12],M=s[13],x=s[14],E=s[15];if(n[0].setComponents(l-r,u-c,m-d,E-p).normalize(),n[1].setComponents(l+r,u+c,m+d,E+p).normalize(),n[2].setComponents(l+o,u+h,m+g,E+M).normalize(),n[3].setComponents(l-o,u-h,m-g,E-M).normalize(),n[4].setComponents(l-a,u-f,m-_,E-x).normalize(),e===kn)n[5].setComponents(l+a,u+f,m+_,E+x).normalize();else if(e===io)n[5].setComponents(a,f,_,x).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+e);return this}intersectsObject(t){if(t.boundingSphere!==void 0)t.boundingSphere===null&&t.computeBoundingSphere(),xi.copy(t.boundingSphere).applyMatrix4(t.matrixWorld);else{const e=t.geometry;e.boundingSphere===null&&e.computeBoundingSphere(),xi.copy(e.boundingSphere).applyMatrix4(t.matrixWorld)}return this.intersectsSphere(xi)}intersectsSprite(t){return xi.center.set(0,0,0),xi.radius=.7071067811865476,xi.applyMatrix4(t.matrixWorld),this.intersectsSphere(xi)}intersectsSphere(t){const e=this.planes,n=t.center,s=-t.radius;for(let r=0;r<6;r++)if(e[r].distanceToPoint(n)<s)return!1;return!0}intersectsBox(t){const e=this.planes;for(let n=0;n<6;n++){const s=e[n];if(Mr.x=s.normal.x>0?t.max.x:t.min.x,Mr.y=s.normal.y>0?t.max.y:t.min.y,Mr.z=s.normal.z>0?t.max.z:t.min.z,s.distanceToPoint(Mr)<0)return!1}return!0}containsPoint(t){const e=this.planes;for(let n=0;n<6;n++)if(e[n].distanceToPoint(t)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}}function zu(){let i=null,t=!1,e=null,n=null;function s(r,o){e(r,o),n=i.requestAnimationFrame(s)}return{start:function(){t!==!0&&e!==null&&(n=i.requestAnimationFrame(s),t=!0)},stop:function(){i.cancelAnimationFrame(n),t=!1},setAnimationLoop:function(r){e=r},setContext:function(r){i=r}}}function ed(i){const t=new WeakMap;function e(a,l){const c=a.array,h=a.usage,f=c.byteLength,u=i.createBuffer();i.bindBuffer(l,u),i.bufferData(l,c,h),a.onUploadCallback();let d;if(c instanceof Float32Array)d=i.FLOAT;else if(c instanceof Uint16Array)a.isFloat16BufferAttribute?d=i.HALF_FLOAT:d=i.UNSIGNED_SHORT;else if(c instanceof Int16Array)d=i.SHORT;else if(c instanceof Uint32Array)d=i.UNSIGNED_INT;else if(c instanceof Int32Array)d=i.INT;else if(c instanceof Int8Array)d=i.BYTE;else if(c instanceof Uint8Array)d=i.UNSIGNED_BYTE;else if(c instanceof Uint8ClampedArray)d=i.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+c);return{buffer:u,type:d,bytesPerElement:c.BYTES_PER_ELEMENT,version:a.version,size:f}}function n(a,l,c){const h=l.array,f=l._updateRange,u=l.updateRanges;if(i.bindBuffer(c,a),f.count===-1&&u.length===0&&i.bufferSubData(c,0,h),u.length!==0){for(let d=0,g=u.length;d<g;d++){const _=u[d];i.bufferSubData(c,_.start*h.BYTES_PER_ELEMENT,h,_.start,_.count)}l.clearUpdateRanges()}f.count!==-1&&(i.bufferSubData(c,f.offset*h.BYTES_PER_ELEMENT,h,f.offset,f.count),f.count=-1),l.onUploadCallback()}function s(a){return a.isInterleavedBufferAttribute&&(a=a.data),t.get(a)}function r(a){a.isInterleavedBufferAttribute&&(a=a.data);const l=t.get(a);l&&(i.deleteBuffer(l.buffer),t.delete(a))}function o(a,l){if(a.isGLBufferAttribute){const h=t.get(a);(!h||h.version<a.version)&&t.set(a,{buffer:a.buffer,type:a.type,bytesPerElement:a.elementSize,version:a.version});return}a.isInterleavedBufferAttribute&&(a=a.data);const c=t.get(a);if(c===void 0)t.set(a,e(a,l));else if(c.version<a.version){if(c.size!==a.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");n(c.buffer,a,l),c.version=a.version}}return{get:s,remove:r,update:o}}class Qs extends We{constructor(t=1,e=1,n=1,s=1){super(),this.type="PlaneGeometry",this.parameters={width:t,height:e,widthSegments:n,heightSegments:s};const r=t/2,o=e/2,a=Math.floor(n),l=Math.floor(s),c=a+1,h=l+1,f=t/a,u=e/l,d=[],g=[],_=[],m=[];for(let p=0;p<h;p++){const M=p*u-o;for(let x=0;x<c;x++){const E=x*f-r;g.push(E,-M,0),_.push(0,0,1),m.push(x/a),m.push(1-p/l)}}for(let p=0;p<l;p++)for(let M=0;M<a;M++){const x=M+c*p,E=M+c*(p+1),A=M+1+c*(p+1),b=M+1+c*p;d.push(x,E,b),d.push(E,A,b)}this.setIndex(d),this.setAttribute("position",new Ve(g,3)),this.setAttribute("normal",new Ve(_,3)),this.setAttribute("uv",new Ve(m,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new Qs(t.width,t.height,t.widthSegments,t.heightSegments)}}var nd=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,id=`#ifdef USE_ALPHAHASH
	const float ALPHA_HASH_SCALE = 0.05;
	float hash2D( vec2 value ) {
		return fract( 1.0e4 * sin( 17.0 * value.x + 0.1 * value.y ) * ( 0.1 + abs( sin( 13.0 * value.y + value.x ) ) ) );
	}
	float hash3D( vec3 value ) {
		return hash2D( vec2( hash2D( value.xy ), value.z ) );
	}
	float getAlphaHashThreshold( vec3 position ) {
		float maxDeriv = max(
			length( dFdx( position.xyz ) ),
			length( dFdy( position.xyz ) )
		);
		float pixScale = 1.0 / ( ALPHA_HASH_SCALE * maxDeriv );
		vec2 pixScales = vec2(
			exp2( floor( log2( pixScale ) ) ),
			exp2( ceil( log2( pixScale ) ) )
		);
		vec2 alpha = vec2(
			hash3D( floor( pixScales.x * position.xyz ) ),
			hash3D( floor( pixScales.y * position.xyz ) )
		);
		float lerpFactor = fract( log2( pixScale ) );
		float x = ( 1.0 - lerpFactor ) * alpha.x + lerpFactor * alpha.y;
		float a = min( lerpFactor, 1.0 - lerpFactor );
		vec3 cases = vec3(
			x * x / ( 2.0 * a * ( 1.0 - a ) ),
			( x - 0.5 * a ) / ( 1.0 - a ),
			1.0 - ( ( 1.0 - x ) * ( 1.0 - x ) / ( 2.0 * a * ( 1.0 - a ) ) )
		);
		float threshold = ( x < ( 1.0 - a ) )
			? ( ( x < a ) ? cases.x : cases.y )
			: cases.z;
		return clamp( threshold , 1.0e-6, 1.0 );
	}
#endif`,sd=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,rd=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,od=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,ad=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,ld=`#ifdef USE_AOMAP
	float ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;
	reflectedLight.indirectDiffuse *= ambientOcclusion;
	#if defined( USE_CLEARCOAT ) 
		clearcoatSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_SHEEN ) 
		sheenSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD )
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
	#endif
#endif`,cd=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,ud=`#ifdef USE_BATCHING
	attribute float batchId;
	uniform highp sampler2D batchingTexture;
	mat4 getBatchingMatrix( const in float i ) {
		int size = textureSize( batchingTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( batchingTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( batchingTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( batchingTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( batchingTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif
#ifdef USE_BATCHING_COLOR
	uniform sampler2D batchingColorTexture;
	vec3 getBatchingColor( const in float i ) {
		int size = textureSize( batchingColorTexture, 0 ).x;
		int j = int( i );
		int x = j % size;
		int y = j / size;
		return texelFetch( batchingColorTexture, ivec2( x, y ), 0 ).rgb;
	}
#endif`,hd=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( batchId );
#endif`,fd=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,dd=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,pd=`float G_BlinnPhong_Implicit( ) {
	return 0.25;
}
float D_BlinnPhong( const in float shininess, const in float dotNH ) {
	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );
}
vec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( specularColor, 1.0, dotVH );
	float G = G_BlinnPhong_Implicit( );
	float D = D_BlinnPhong( shininess, dotNH );
	return F * ( G * D );
} // validated`,md=`#ifdef USE_IRIDESCENCE
	const mat3 XYZ_TO_REC709 = mat3(
		 3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);
	vec3 Fresnel0ToIor( vec3 fresnel0 ) {
		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );
	}
	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );
	}
	float IorToFresnel0( float transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));
	}
	vec3 evalSensitivity( float OPD, vec3 shift ) {
		float phase = 2.0 * PI * OPD * 1.0e-9;
		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );
		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );
		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );
		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );
		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );
		xyz /= 1.0685e-7;
		vec3 rgb = XYZ_TO_REC709 * xyz;
		return rgb;
	}
	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {
		vec3 I;
		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );
		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {
			return vec3( 1.0 );
		}
		float cosTheta2 = sqrt( cosTheta2Sq );
		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );
		float R12 = F_Schlick( R0, 1.0, cosTheta1 );
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIOR < outsideIOR ) phi12 = PI;
		float phi21 = PI - phi12;
		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );
		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;
		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;
		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;
		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );
		vec3 C0 = R12 + Rs;
		I = C0;
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {
			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;
		}
		return max( I, vec3( 0.0 ) );
	}
#endif`,gd=`#ifdef USE_BUMPMAP
	uniform sampler2D bumpMap;
	uniform float bumpScale;
	vec2 dHdxy_fwd() {
		vec2 dSTdx = dFdx( vBumpMapUv );
		vec2 dSTdy = dFdy( vBumpMapUv );
		float Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;
		return vec2( dBx, dBy );
	}
	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
		vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );
		vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );
		vec3 vN = surf_norm;
		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );
		float fDet = dot( vSigmaX, R1 ) * faceDirection;
		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );
	}
#endif`,_d=`#if NUM_CLIPPING_PLANES > 0
	vec4 plane;
	#ifdef ALPHA_TO_COVERAGE
		float distanceToPlane, distanceGradient;
		float clipOpacity = 1.0;
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
			distanceGradient = fwidth( distanceToPlane ) / 2.0;
			clipOpacity *= smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			if ( clipOpacity == 0.0 ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			float unionClipOpacity = 1.0;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
				distanceGradient = fwidth( distanceToPlane ) / 2.0;
				unionClipOpacity *= 1.0 - smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			}
			#pragma unroll_loop_end
			clipOpacity *= 1.0 - unionClipOpacity;
		#endif
		diffuseColor.a *= clipOpacity;
		if ( diffuseColor.a == 0.0 ) discard;
	#else
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			bool clipped = true;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;
			}
			#pragma unroll_loop_end
			if ( clipped ) discard;
		#endif
	#endif
#endif`,xd=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,vd=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,Md=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,Sd=`#if defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#elif defined( USE_COLOR )
	diffuseColor.rgb *= vColor;
#endif`,yd=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR )
	varying vec3 vColor;
#endif`,Ed=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec3 vColor;
#endif`,Td=`#if defined( USE_COLOR_ALPHA )
	vColor = vec4( 1.0 );
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	vColor = vec3( 1.0 );
#endif
#ifdef USE_COLOR
	vColor *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.xyz *= instanceColor.xyz;
#endif
#ifdef USE_BATCHING_COLOR
	vec3 batchingColor = getBatchingColor( batchId );
	vColor.xyz *= batchingColor.xyz;
#endif`,bd=`#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6
#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement( a ) ( 1.0 - saturate( a ) )
float pow2( const in float x ) { return x*x; }
vec3 pow2( const in vec3 x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
float average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }
highp float rand( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract( sin( sn ) * c );
}
#ifdef HIGH_PRECISION
	float precisionSafeLength( vec3 v ) { return length( v ); }
#else
	float precisionSafeLength( vec3 v ) {
		float maxComponent = max3( abs( v ) );
		return length( v / maxComponent ) * maxComponent;
	}
#endif
struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};
struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};
#ifdef USE_ALPHAHASH
	varying vec3 vPosition;
#endif
vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
}
vec3 inverseTransformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( vec4( dir, 0.0 ) * matrix ).xyz );
}
mat3 transposeMat3( const in mat3 m ) {
	mat3 tmp;
	tmp[ 0 ] = vec3( m[ 0 ].x, m[ 1 ].x, m[ 2 ].x );
	tmp[ 1 ] = vec3( m[ 0 ].y, m[ 1 ].y, m[ 2 ].y );
	tmp[ 2 ] = vec3( m[ 0 ].z, m[ 1 ].z, m[ 2 ].z );
	return tmp;
}
float luminance( const in vec3 rgb ) {
	const vec3 weights = vec3( 0.2126729, 0.7151522, 0.0721750 );
	return dot( weights, rgb );
}
bool isPerspectiveMatrix( mat4 m ) {
	return m[ 2 ][ 3 ] == - 1.0;
}
vec2 equirectUv( in vec3 dir ) {
	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
	return vec2( u, v );
}
vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
	return RECIPROCAL_PI * diffuseColor;
}
vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
} // validated`,Ad=`#ifdef ENVMAP_TYPE_CUBE_UV
	#define cubeUV_minMipLevel 4.0
	#define cubeUV_minTileSize 16.0
	float getFace( vec3 direction ) {
		vec3 absDirection = abs( direction );
		float face = - 1.0;
		if ( absDirection.x > absDirection.z ) {
			if ( absDirection.x > absDirection.y )
				face = direction.x > 0.0 ? 0.0 : 3.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		} else {
			if ( absDirection.z > absDirection.y )
				face = direction.z > 0.0 ? 2.0 : 5.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		}
		return face;
	}
	vec2 getUV( vec3 direction, float face ) {
		vec2 uv;
		if ( face == 0.0 ) {
			uv = vec2( direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 1.0 ) {
			uv = vec2( - direction.x, - direction.z ) / abs( direction.y );
		} else if ( face == 2.0 ) {
			uv = vec2( - direction.x, direction.y ) / abs( direction.z );
		} else if ( face == 3.0 ) {
			uv = vec2( - direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 4.0 ) {
			uv = vec2( - direction.x, direction.z ) / abs( direction.y );
		} else {
			uv = vec2( direction.x, direction.y ) / abs( direction.z );
		}
		return 0.5 * ( uv + 1.0 );
	}
	vec3 bilinearCubeUV( sampler2D envMap, vec3 direction, float mipInt ) {
		float face = getFace( direction );
		float filterInt = max( cubeUV_minMipLevel - mipInt, 0.0 );
		mipInt = max( mipInt, cubeUV_minMipLevel );
		float faceSize = exp2( mipInt );
		highp vec2 uv = getUV( direction, face ) * ( faceSize - 2.0 ) + 1.0;
		if ( face > 2.0 ) {
			uv.y += faceSize;
			face -= 3.0;
		}
		uv.x += face * faceSize;
		uv.x += filterInt * 3.0 * cubeUV_minTileSize;
		uv.y += 4.0 * ( exp2( CUBEUV_MAX_MIP ) - faceSize );
		uv.x *= CUBEUV_TEXEL_WIDTH;
		uv.y *= CUBEUV_TEXEL_HEIGHT;
		#ifdef texture2DGradEXT
			return texture2DGradEXT( envMap, uv, vec2( 0.0 ), vec2( 0.0 ) ).rgb;
		#else
			return texture2D( envMap, uv ).rgb;
		#endif
	}
	#define cubeUV_r0 1.0
	#define cubeUV_m0 - 2.0
	#define cubeUV_r1 0.8
	#define cubeUV_m1 - 1.0
	#define cubeUV_r4 0.4
	#define cubeUV_m4 2.0
	#define cubeUV_r5 0.305
	#define cubeUV_m5 3.0
	#define cubeUV_r6 0.21
	#define cubeUV_m6 4.0
	float roughnessToMip( float roughness ) {
		float mip = 0.0;
		if ( roughness >= cubeUV_r1 ) {
			mip = ( cubeUV_r0 - roughness ) * ( cubeUV_m1 - cubeUV_m0 ) / ( cubeUV_r0 - cubeUV_r1 ) + cubeUV_m0;
		} else if ( roughness >= cubeUV_r4 ) {
			mip = ( cubeUV_r1 - roughness ) * ( cubeUV_m4 - cubeUV_m1 ) / ( cubeUV_r1 - cubeUV_r4 ) + cubeUV_m1;
		} else if ( roughness >= cubeUV_r5 ) {
			mip = ( cubeUV_r4 - roughness ) * ( cubeUV_m5 - cubeUV_m4 ) / ( cubeUV_r4 - cubeUV_r5 ) + cubeUV_m4;
		} else if ( roughness >= cubeUV_r6 ) {
			mip = ( cubeUV_r5 - roughness ) * ( cubeUV_m6 - cubeUV_m5 ) / ( cubeUV_r5 - cubeUV_r6 ) + cubeUV_m5;
		} else {
			mip = - 2.0 * log2( 1.16 * roughness );		}
		return mip;
	}
	vec4 textureCubeUV( sampler2D envMap, vec3 sampleDir, float roughness ) {
		float mip = clamp( roughnessToMip( roughness ), cubeUV_m0, CUBEUV_MAX_MIP );
		float mipF = fract( mip );
		float mipInt = floor( mip );
		vec3 color0 = bilinearCubeUV( envMap, sampleDir, mipInt );
		if ( mipF == 0.0 ) {
			return vec4( color0, 1.0 );
		} else {
			vec3 color1 = bilinearCubeUV( envMap, sampleDir, mipInt + 1.0 );
			return vec4( mix( color0, color1, mipF ), 1.0 );
		}
	}
#endif`,wd=`vec3 transformedNormal = objectNormal;
#ifdef USE_TANGENT
	vec3 transformedTangent = objectTangent;
#endif
#ifdef USE_BATCHING
	mat3 bm = mat3( batchingMatrix );
	transformedNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );
	transformedNormal = bm * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = bm * transformedTangent;
	#endif
#endif
#ifdef USE_INSTANCING
	mat3 im = mat3( instanceMatrix );
	transformedNormal /= vec3( dot( im[ 0 ], im[ 0 ] ), dot( im[ 1 ], im[ 1 ] ), dot( im[ 2 ], im[ 2 ] ) );
	transformedNormal = im * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = im * transformedTangent;
	#endif
#endif
transformedNormal = normalMatrix * transformedNormal;
#ifdef FLIP_SIDED
	transformedNormal = - transformedNormal;
#endif
#ifdef USE_TANGENT
	transformedTangent = ( modelViewMatrix * vec4( transformedTangent, 0.0 ) ).xyz;
	#ifdef FLIP_SIDED
		transformedTangent = - transformedTangent;
	#endif
#endif`,Rd=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,Cd=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,Pd=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,Ld=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,Dd="gl_FragColor = linearToOutputTexel( gl_FragColor );",Ud=`
const mat3 LINEAR_SRGB_TO_LINEAR_DISPLAY_P3 = mat3(
	vec3( 0.8224621, 0.177538, 0.0 ),
	vec3( 0.0331941, 0.9668058, 0.0 ),
	vec3( 0.0170827, 0.0723974, 0.9105199 )
);
const mat3 LINEAR_DISPLAY_P3_TO_LINEAR_SRGB = mat3(
	vec3( 1.2249401, - 0.2249404, 0.0 ),
	vec3( - 0.0420569, 1.0420571, 0.0 ),
	vec3( - 0.0196376, - 0.0786361, 1.0982735 )
);
vec4 LinearSRGBToLinearDisplayP3( in vec4 value ) {
	return vec4( value.rgb * LINEAR_SRGB_TO_LINEAR_DISPLAY_P3, value.a );
}
vec4 LinearDisplayP3ToLinearSRGB( in vec4 value ) {
	return vec4( value.rgb * LINEAR_DISPLAY_P3_TO_LINEAR_SRGB, value.a );
}
vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}
vec4 LinearToLinear( in vec4 value ) {
	return value;
}
vec4 LinearTosRGB( in vec4 value ) {
	return sRGBTransferOETF( value );
}`,Id=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vec3 cameraToFrag;
		if ( isOrthographic ) {
			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToFrag = normalize( vWorldPosition - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vec3 reflectVec = reflect( cameraToFrag, worldNormal );
		#else
			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );
		#endif
	#else
		vec3 reflectVec = vReflect;
	#endif
	#ifdef ENVMAP_TYPE_CUBE
		vec4 envColor = textureCube( envMap, envMapRotation * vec3( flipEnvMap * reflectVec.x, reflectVec.yz ) );
	#else
		vec4 envColor = vec4( 0.0 );
	#endif
	#ifdef ENVMAP_BLENDING_MULTIPLY
		outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_MIX )
		outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_ADD )
		outgoingLight += envColor.xyz * specularStrength * reflectivity;
	#endif
#endif`,Nd=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform float flipEnvMap;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
	
#endif`,Fd=`#ifdef USE_ENVMAP
	uniform float reflectivity;
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		varying vec3 vWorldPosition;
		uniform float refractionRatio;
	#else
		varying vec3 vReflect;
	#endif
#endif`,Od=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,zd=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vWorldPosition = worldPosition.xyz;
	#else
		vec3 cameraToVertex;
		if ( isOrthographic ) {
			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vReflect = reflect( cameraToVertex, worldNormal );
		#else
			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );
		#endif
	#endif
#endif`,Bd=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,kd=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,Hd=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,Gd=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,Vd=`#ifdef USE_GRADIENTMAP
	uniform sampler2D gradientMap;
#endif
vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
	float dotNL = dot( normal, lightDirection );
	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );
	#ifdef USE_GRADIENTMAP
		return vec3( texture2D( gradientMap, coord ).r );
	#else
		vec2 fw = fwidth( coord ) * 0.5;
		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );
	#endif
}`,Wd=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,Xd=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,qd=`varying vec3 vViewPosition;
struct LambertMaterial {
	vec3 diffuseColor;
	float specularStrength;
};
void RE_Direct_Lambert( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Lambert
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,Yd=`uniform bool receiveShadow;
uniform vec3 ambientLightColor;
#if defined( USE_LIGHT_PROBES )
	uniform vec3 lightProbe[ 9 ];
#endif
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {
	float x = normal.x, y = normal.y, z = normal.z;
	vec3 result = shCoefficients[ 0 ] * 0.886227;
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;
	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );
	return result;
}
vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {
	vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
	return irradiance;
}
vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
	vec3 irradiance = ambientLightColor;
	return irradiance;
}
float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
	float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
	if ( cutoffDistance > 0.0 ) {
		distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
	}
	return distanceFalloff;
}
float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
	return smoothstep( coneCosine, penumbraCosine, angleCosine );
}
#if NUM_DIR_LIGHTS > 0
	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};
	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
	void getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {
		light.color = directionalLight.color;
		light.direction = directionalLight.direction;
		light.visible = true;
	}
#endif
#if NUM_POINT_LIGHTS > 0
	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};
	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
	void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = pointLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float lightDistance = length( lVector );
		light.color = pointLight.color;
		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );
	}
#endif
#if NUM_SPOT_LIGHTS > 0
	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};
	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
	void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = spotLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float angleCos = dot( light.direction, spotLight.direction );
		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );
		if ( spotAttenuation > 0.0 ) {
			float lightDistance = length( lVector );
			light.color = spotLight.color * spotAttenuation;
			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
			light.visible = ( light.color != vec3( 0.0 ) );
		} else {
			light.color = vec3( 0.0 );
			light.visible = false;
		}
	}
#endif
#if NUM_RECT_AREA_LIGHTS > 0
	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};
	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;
	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];
#endif
#if NUM_HEMI_LIGHTS > 0
	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};
	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {
		float dotNL = dot( normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );
		return irradiance;
	}
#endif`,jd=`#ifdef USE_ENVMAP
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * worldNormal, 1.0 );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, roughness * roughness) );
			reflectVec = inverseTransformDirection( reflectVec, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * reflectVec, roughness );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	#ifdef USE_ANISOTROPY
		vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 bentNormal = cross( bitangent, viewDir );
				bentNormal = normalize( cross( bentNormal, bitangent ) );
				bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
				return getIBLRadiance( viewDir, bentNormal, roughness );
			#else
				return vec3( 0.0 );
			#endif
		}
	#endif
#endif`,Kd=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,$d=`varying vec3 vViewPosition;
struct ToonMaterial {
	vec3 diffuseColor;
};
void RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,Zd=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,Jd=`varying vec3 vViewPosition;
struct BlinnPhongMaterial {
	vec3 diffuseColor;
	vec3 specularColor;
	float specularShininess;
	float specularStrength;
};
void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometryViewDir, geometryNormal, material.specularColor, material.specularShininess ) * material.specularStrength;
}
void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,Qd=`PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb * ( 1.0 - metalnessFactor );
vec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
material.roughness = max( roughnessFactor, 0.0525 );material.roughness += geometryRoughness;
material.roughness = min( material.roughness, 1.0 );
#ifdef IOR
	material.ior = ior;
	#ifdef USE_SPECULAR
		float specularIntensityFactor = specularIntensity;
		vec3 specularColorFactor = specularColor;
		#ifdef USE_SPECULAR_COLORMAP
			specularColorFactor *= texture2D( specularColorMap, vSpecularColorMapUv ).rgb;
		#endif
		#ifdef USE_SPECULAR_INTENSITYMAP
			specularIntensityFactor *= texture2D( specularIntensityMap, vSpecularIntensityMapUv ).a;
		#endif
		material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );
	#else
		float specularIntensityFactor = 1.0;
		vec3 specularColorFactor = vec3( 1.0 );
		material.specularF90 = 1.0;
	#endif
	material.specularColor = mix( min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor, diffuseColor.rgb, metalnessFactor );
#else
	material.specularColor = mix( vec3( 0.04 ), diffuseColor.rgb, metalnessFactor );
	material.specularF90 = 1.0;
#endif
#ifdef USE_CLEARCOAT
	material.clearcoat = clearcoat;
	material.clearcoatRoughness = clearcoatRoughness;
	material.clearcoatF0 = vec3( 0.04 );
	material.clearcoatF90 = 1.0;
	#ifdef USE_CLEARCOATMAP
		material.clearcoat *= texture2D( clearcoatMap, vClearcoatMapUv ).x;
	#endif
	#ifdef USE_CLEARCOAT_ROUGHNESSMAP
		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vClearcoatRoughnessMapUv ).y;
	#endif
	material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.0525 );
	material.clearcoatRoughness += geometryRoughness;
	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
#endif
#ifdef USE_DISPERSION
	material.dispersion = dispersion;
#endif
#ifdef USE_IRIDESCENCE
	material.iridescence = iridescence;
	material.iridescenceIOR = iridescenceIOR;
	#ifdef USE_IRIDESCENCEMAP
		material.iridescence *= texture2D( iridescenceMap, vIridescenceMapUv ).r;
	#endif
	#ifdef USE_IRIDESCENCE_THICKNESSMAP
		material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vIridescenceThicknessMapUv ).g + iridescenceThicknessMinimum;
	#else
		material.iridescenceThickness = iridescenceThicknessMaximum;
	#endif
#endif
#ifdef USE_SHEEN
	material.sheenColor = sheenColor;
	#ifdef USE_SHEEN_COLORMAP
		material.sheenColor *= texture2D( sheenColorMap, vSheenColorMapUv ).rgb;
	#endif
	material.sheenRoughness = clamp( sheenRoughness, 0.07, 1.0 );
	#ifdef USE_SHEEN_ROUGHNESSMAP
		material.sheenRoughness *= texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).a;
	#endif
#endif
#ifdef USE_ANISOTROPY
	#ifdef USE_ANISOTROPYMAP
		mat2 anisotropyMat = mat2( anisotropyVector.x, anisotropyVector.y, - anisotropyVector.y, anisotropyVector.x );
		vec3 anisotropyPolar = texture2D( anisotropyMap, vAnisotropyMapUv ).rgb;
		vec2 anisotropyV = anisotropyMat * normalize( 2.0 * anisotropyPolar.rg - vec2( 1.0 ) ) * anisotropyPolar.b;
	#else
		vec2 anisotropyV = anisotropyVector;
	#endif
	material.anisotropy = length( anisotropyV );
	if( material.anisotropy == 0.0 ) {
		anisotropyV = vec2( 1.0, 0.0 );
	} else {
		anisotropyV /= material.anisotropy;
		material.anisotropy = saturate( material.anisotropy );
	}
	material.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );
	material.anisotropyT = tbn[ 0 ] * anisotropyV.x + tbn[ 1 ] * anisotropyV.y;
	material.anisotropyB = tbn[ 1 ] * anisotropyV.x - tbn[ 0 ] * anisotropyV.y;
#endif`,tp=`struct PhysicalMaterial {
	vec3 diffuseColor;
	float roughness;
	vec3 specularColor;
	float specularF90;
	float dispersion;
	#ifdef USE_CLEARCOAT
		float clearcoat;
		float clearcoatRoughness;
		vec3 clearcoatF0;
		float clearcoatF90;
	#endif
	#ifdef USE_IRIDESCENCE
		float iridescence;
		float iridescenceIOR;
		float iridescenceThickness;
		vec3 iridescenceFresnel;
		vec3 iridescenceF0;
	#endif
	#ifdef USE_SHEEN
		vec3 sheenColor;
		float sheenRoughness;
	#endif
	#ifdef IOR
		float ior;
	#endif
	#ifdef USE_TRANSMISSION
		float transmission;
		float transmissionAlpha;
		float thickness;
		float attenuationDistance;
		vec3 attenuationColor;
	#endif
	#ifdef USE_ANISOTROPY
		float anisotropy;
		float alphaT;
		vec3 anisotropyT;
		vec3 anisotropyB;
	#endif
};
vec3 clearcoatSpecularDirect = vec3( 0.0 );
vec3 clearcoatSpecularIndirect = vec3( 0.0 );
vec3 sheenSpecularDirect = vec3( 0.0 );
vec3 sheenSpecularIndirect = vec3(0.0 );
vec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {
    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );
    float x2 = x * x;
    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );
    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );
}
float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {
	float a2 = pow2( alpha );
	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
	return 0.5 / max( gv + gl, EPSILON );
}
float D_GGX( const in float alpha, const in float dotNH ) {
	float a2 = pow2( alpha );
	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;
	return RECIPROCAL_PI * a2 / pow2( denom );
}
#ifdef USE_ANISOTROPY
	float V_GGX_SmithCorrelated_Anisotropic( const in float alphaT, const in float alphaB, const in float dotTV, const in float dotBV, const in float dotTL, const in float dotBL, const in float dotNV, const in float dotNL ) {
		float gv = dotNL * length( vec3( alphaT * dotTV, alphaB * dotBV, dotNV ) );
		float gl = dotNV * length( vec3( alphaT * dotTL, alphaB * dotBL, dotNL ) );
		float v = 0.5 / ( gv + gl );
		return saturate(v);
	}
	float D_GGX_Anisotropic( const in float alphaT, const in float alphaB, const in float dotNH, const in float dotTH, const in float dotBH ) {
		float a2 = alphaT * alphaB;
		highp vec3 v = vec3( alphaB * dotTH, alphaT * dotBH, a2 * dotNH );
		highp float v2 = dot( v, v );
		float w2 = a2 / v2;
		return RECIPROCAL_PI * a2 * pow2 ( w2 );
	}
#endif
#ifdef USE_CLEARCOAT
	vec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {
		vec3 f0 = material.clearcoatF0;
		float f90 = material.clearcoatF90;
		float roughness = material.clearcoatRoughness;
		float alpha = pow2( roughness );
		vec3 halfDir = normalize( lightDir + viewDir );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float dotNH = saturate( dot( normal, halfDir ) );
		float dotVH = saturate( dot( viewDir, halfDir ) );
		vec3 F = F_Schlick( f0, f90, dotVH );
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
		return F * ( V * D );
	}
#endif
vec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 f0 = material.specularColor;
	float f90 = material.specularF90;
	float roughness = material.roughness;
	float alpha = pow2( roughness );
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( f0, f90, dotVH );
	#ifdef USE_IRIDESCENCE
		F = mix( F, material.iridescenceFresnel, material.iridescence );
	#endif
	#ifdef USE_ANISOTROPY
		float dotTL = dot( material.anisotropyT, lightDir );
		float dotTV = dot( material.anisotropyT, viewDir );
		float dotTH = dot( material.anisotropyT, halfDir );
		float dotBL = dot( material.anisotropyB, lightDir );
		float dotBV = dot( material.anisotropyB, viewDir );
		float dotBH = dot( material.anisotropyB, halfDir );
		float V = V_GGX_SmithCorrelated_Anisotropic( material.alphaT, alpha, dotTV, dotBV, dotTL, dotBL, dotNV, dotNL );
		float D = D_GGX_Anisotropic( material.alphaT, alpha, dotNH, dotTH, dotBH );
	#else
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
	#endif
	return F * ( V * D );
}
vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {
	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;
	float dotNV = saturate( dot( N, V ) );
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );
	uv = uv * LUT_SCALE + LUT_BIAS;
	return uv;
}
float LTC_ClippedSphereFormFactor( const in vec3 f ) {
	float l = length( f );
	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
}
vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {
	float x = dot( v1, v2 );
	float y = abs( x );
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;
	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;
	return cross( v1, v2 ) * theta_sintheta;
}
vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {
	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
	vec3 lightNormal = cross( v1, v2 );
	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );
	vec3 T1, T2;
	T1 = normalize( V - N * dot( V, N ) );
	T2 = - cross( N, T1 );
	mat3 mat = mInv * transposeMat3( mat3( T1, T2, N ) );
	vec3 coords[ 4 ];
	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );
	coords[ 0 ] = normalize( coords[ 0 ] );
	coords[ 1 ] = normalize( coords[ 1 ] );
	coords[ 2 ] = normalize( coords[ 2 ] );
	coords[ 3 ] = normalize( coords[ 3 ] );
	vec3 vectorFormFactor = vec3( 0.0 );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );
	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );
	return vec3( result );
}
#if defined( USE_SHEEN )
float D_Charlie( float roughness, float dotNH ) {
	float alpha = pow2( roughness );
	float invAlpha = 1.0 / alpha;
	float cos2h = dotNH * dotNH;
	float sin2h = max( 1.0 - cos2h, 0.0078125 );
	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );
}
float V_Neubelt( float dotNV, float dotNL ) {
	return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );
}
vec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float D = D_Charlie( sheenRoughness, dotNH );
	float V = V_Neubelt( dotNV, dotNL );
	return sheenColor * ( D * V );
}
#endif
float IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	float r2 = roughness * roughness;
	float a = roughness < 0.25 ? -339.2 * r2 + 161.4 * roughness - 25.9 : -8.48 * r2 + 14.3 * roughness - 9.95;
	float b = roughness < 0.25 ? 44.0 * r2 - 23.7 * roughness + 3.26 : 1.97 * r2 - 3.27 * roughness + 0.72;
	float DG = exp( a * dotNV + b ) + ( roughness < 0.25 ? 0.0 : 0.1 * ( roughness - 0.25 ) );
	return saturate( DG * RECIPROCAL_PI );
}
vec2 DFGApprox( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	const vec4 c0 = vec4( - 1, - 0.0275, - 0.572, 0.022 );
	const vec4 c1 = vec4( 1, 0.0425, 1.04, - 0.04 );
	vec4 r = roughness * c0 + c1;
	float a004 = min( r.x * r.x, exp2( - 9.28 * dotNV ) ) * r.x + r.y;
	vec2 fab = vec2( - 1.04, 1.04 ) * a004 + r.zw;
	return fab;
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	return specularColor * fab.x + specularF90 * fab.y;
}
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	#ifdef USE_IRIDESCENCE
		vec3 Fr = mix( specularColor, iridescenceF0, iridescence );
	#else
		vec3 Fr = specularColor;
	#endif
	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;
	float Ess = fab.x + fab.y;
	float Ems = 1.0 - Ess;
	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );
	singleScatter += FssEss;
	multiScatter += Fms * Ems;
}
#if NUM_RECT_AREA_LIGHTS > 0
	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
		vec3 normal = geometryNormal;
		vec3 viewDir = geometryViewDir;
		vec3 position = geometryPosition;
		vec3 lightPos = rectAreaLight.position;
		vec3 halfWidth = rectAreaLight.halfWidth;
		vec3 halfHeight = rectAreaLight.halfHeight;
		vec3 lightColor = rectAreaLight.color;
		float roughness = material.roughness;
		vec3 rectCoords[ 4 ];
		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight;		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;
		vec2 uv = LTC_Uv( normal, viewDir, roughness );
		vec4 t1 = texture2D( ltc_1, uv );
		vec4 t2 = texture2D( ltc_2, uv );
		mat3 mInv = mat3(
			vec3( t1.x, 0, t1.y ),
			vec3(    0, 1,    0 ),
			vec3( t1.z, 0, t1.w )
		);
		vec3 fresnel = ( material.specularColor * t2.x + ( vec3( 1.0 ) - material.specularColor ) * t2.y );
		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
		reflectedLight.directDiffuse += lightColor * material.diffuseColor * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
	}
#endif
void RE_Direct_Physical( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	#ifdef USE_CLEARCOAT
		float dotNLcc = saturate( dot( geometryClearcoatNormal, directLight.direction ) );
		vec3 ccIrradiance = dotNLcc * directLight.color;
		clearcoatSpecularDirect += ccIrradiance * BRDF_GGX_Clearcoat( directLight.direction, geometryViewDir, geometryClearcoatNormal, material );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularDirect += irradiance * BRDF_Sheen( directLight.direction, geometryViewDir, geometryNormal, material.sheenColor, material.sheenRoughness );
	#endif
	reflectedLight.directSpecular += irradiance * BRDF_GGX( directLight.direction, geometryViewDir, geometryNormal, material );
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
	#ifdef USE_CLEARCOAT
		clearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
	#endif
	vec3 singleScattering = vec3( 0.0 );
	vec3 multiScattering = vec3( 0.0 );
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.iridescence, material.iridescenceFresnel, material.roughness, singleScattering, multiScattering );
	#else
		computeMultiscattering( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.roughness, singleScattering, multiScattering );
	#endif
	vec3 totalScattering = singleScattering + multiScattering;
	vec3 diffuse = material.diffuseColor * ( 1.0 - max( max( totalScattering.r, totalScattering.g ), totalScattering.b ) );
	reflectedLight.indirectSpecular += radiance * singleScattering;
	reflectedLight.indirectSpecular += multiScattering * cosineWeightedIrradiance;
	reflectedLight.indirectDiffuse += diffuse * cosineWeightedIrradiance;
}
#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}`,ep=`
vec3 geometryPosition = - vViewPosition;
vec3 geometryNormal = normal;
vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
vec3 geometryClearcoatNormal = vec3( 0.0 );
#ifdef USE_CLEARCOAT
	geometryClearcoatNormal = clearcoatNormal;
#endif
#ifdef USE_IRIDESCENCE
	float dotNVi = saturate( dot( normal, geometryViewDir ) );
	if ( material.iridescenceThickness == 0.0 ) {
		material.iridescence = 0.0;
	} else {
		material.iridescence = saturate( material.iridescence );
	}
	if ( material.iridescence > 0.0 ) {
		material.iridescenceFresnel = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		material.iridescenceF0 = Schlick_to_F0( material.iridescenceFresnel, 1.0, dotNVi );
	}
#endif
IncidentLight directLight;
#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		pointLight = pointLights[ i ];
		getPointLightInfo( pointLight, geometryPosition, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
	SpotLight spotLight;
	vec4 spotColor;
	vec3 spotLightCoord;
	bool inSpotLightMap;
	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
		spotLight = spotLights[ i ];
		getSpotLightInfo( spotLight, geometryPosition, directLight );
		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX
		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS
		#else
		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#endif
		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )
			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;
			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );
			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );
			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;
		#endif
		#undef SPOT_LIGHT_MAP_INDEX
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		directionalLight = directionalLights[ i ];
		getDirectionalLightInfo( directionalLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
	RectAreaLight rectAreaLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if defined( RE_IndirectDiffuse )
	vec3 iblIrradiance = vec3( 0.0 );
	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
	#if defined( USE_LIGHT_PROBES )
		irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );
	#endif
	#if ( NUM_HEMI_LIGHTS > 0 )
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );
		}
		#pragma unroll_loop_end
	#endif
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );
#endif`,np=`#if defined( RE_IndirectDiffuse )
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
		irradiance += lightMapIrradiance;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD ) && defined( ENVMAP_TYPE_CUBE_UV )
		iblIrradiance += getIBLIrradiance( geometryNormal );
	#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	#ifdef USE_ANISOTROPY
		radiance += getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
	#else
		radiance += getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );
	#endif
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`,ip=`#if defined( RE_IndirectDiffuse )
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,sp=`#if defined( USE_LOGDEPTHBUF )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,rp=`#if defined( USE_LOGDEPTHBUF )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,op=`#ifdef USE_LOGDEPTHBUF
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,ap=`#ifdef USE_LOGDEPTHBUF
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,lp=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = vec4( mix( pow( sampledDiffuseColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), sampledDiffuseColor.rgb * 0.0773993808, vec3( lessThanEqual( sampledDiffuseColor.rgb, vec3( 0.04045 ) ) ) ), sampledDiffuseColor.w );
	
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,cp=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,up=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	#if defined( USE_POINTS_UV )
		vec2 uv = vUv;
	#else
		vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
	#endif
#endif
#ifdef USE_MAP
	diffuseColor *= texture2D( map, uv );
#endif
#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, uv ).g;
#endif`,hp=`#if defined( USE_POINTS_UV )
	varying vec2 vUv;
#else
	#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
		uniform mat3 uvTransform;
	#endif
#endif
#ifdef USE_MAP
	uniform sampler2D map;
#endif
#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,fp=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,dp=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,pp=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,mp=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,gp=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,_p=`#ifdef USE_MORPHTARGETS
	#ifndef USE_INSTANCING_MORPH
		uniform float morphTargetBaseInfluence;
		uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	#endif
	uniform sampler2DArray morphTargetsTexture;
	uniform ivec2 morphTargetsTextureSize;
	vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {
		int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;
		int y = texelIndex / morphTargetsTextureSize.x;
		int x = texelIndex - y * morphTargetsTextureSize.x;
		ivec3 morphUV = ivec3( x, y, morphTargetIndex );
		return texelFetch( morphTargetsTexture, morphUV, 0 );
	}
#endif`,xp=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,vp=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
#ifdef FLAT_SHADED
	vec3 fdx = dFdx( vViewPosition );
	vec3 fdy = dFdy( vViewPosition );
	vec3 normal = normalize( cross( fdx, fdy ) );
#else
	vec3 normal = normalize( vNormal );
	#ifdef DOUBLE_SIDED
		normal *= faceDirection;
	#endif
#endif
#if defined( USE_NORMALMAP_TANGENTSPACE ) || defined( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY )
	#ifdef USE_TANGENT
		mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn = getTangentFrame( - vViewPosition, normal,
		#if defined( USE_NORMALMAP )
			vNormalMapUv
		#elif defined( USE_CLEARCOAT_NORMALMAP )
			vClearcoatNormalMapUv
		#else
			vUv
		#endif
		);
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn[0] *= faceDirection;
		tbn[1] *= faceDirection;
	#endif
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	#ifdef USE_TANGENT
		mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn2[0] *= faceDirection;
		tbn2[1] *= faceDirection;
	#endif
#endif
vec3 nonPerturbedNormal = normal;`,Mp=`#ifdef USE_NORMALMAP_OBJECTSPACE
	normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#ifdef FLIP_SIDED
		normal = - normal;
	#endif
	#ifdef DOUBLE_SIDED
		normal = normal * faceDirection;
	#endif
	normal = normalize( normalMatrix * normal );
#elif defined( USE_NORMALMAP_TANGENTSPACE )
	vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	mapN.xy *= normalScale;
	normal = normalize( tbn * mapN );
#elif defined( USE_BUMPMAP )
	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif`,Sp=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,yp=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Ep=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
	#endif
#endif`,Tp=`#ifdef USE_NORMALMAP
	uniform sampler2D normalMap;
	uniform vec2 normalScale;
#endif
#ifdef USE_NORMALMAP_OBJECTSPACE
	uniform mat3 normalMatrix;
#endif
#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY ) )
	mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {
		vec3 q0 = dFdx( eye_pos.xyz );
		vec3 q1 = dFdy( eye_pos.xyz );
		vec2 st0 = dFdx( uv.st );
		vec2 st1 = dFdy( uv.st );
		vec3 N = surf_norm;
		vec3 q1perp = cross( q1, N );
		vec3 q0perp = cross( N, q0 );
		vec3 T = q1perp * st0.x + q0perp * st1.x;
		vec3 B = q1perp * st0.y + q0perp * st1.y;
		float det = max( dot( T, T ), dot( B, B ) );
		float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );
		return mat3( T * scale, B * scale, N );
	}
#endif`,bp=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,Ap=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,wp=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,Rp=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,Cp=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,Pp=`vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}
vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}
const float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;
const vec3 PackFactors = vec3( 256. * 256. * 256., 256. * 256., 256. );
const vec4 UnpackFactors = UnpackDownscale / vec4( PackFactors, 1. );
const float ShiftRight8 = 1. / 256.;
vec4 packDepthToRGBA( const in float v ) {
	vec4 r = vec4( fract( v * PackFactors ), v );
	r.yzw -= r.xyz * ShiftRight8;	return r * PackUpscale;
}
float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors );
}
vec2 packDepthToRG( in highp float v ) {
	return packDepthToRGBA( v ).yx;
}
float unpackRGToDepth( const in highp vec2 v ) {
	return unpackRGBAToDepth( vec4( v.xy, 0.0, 0.0 ) );
}
vec4 pack2HalfToRGBA( vec2 v ) {
	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
}
vec2 unpackRGBATo2Half( vec4 v ) {
	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	return ( viewZ + near ) / ( near - far );
}
float orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return depth * ( near - far ) - near;
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return ( near * far ) / ( ( far - near ) * depth - far );
}`,Lp=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,Dp=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,Up=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,Ip=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,Np=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,Fp=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,Op=`#if NUM_SPOT_LIGHT_COORDS > 0
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		struct SpotLightShadow {
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform sampler2D pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
	float texture2DCompare( sampler2D depths, vec2 uv, float compare ) {
		return step( compare, unpackRGBAToDepth( texture2D( depths, uv ) ) );
	}
	vec2 texture2DDistribution( sampler2D shadow, vec2 uv ) {
		return unpackRGBATo2Half( texture2D( shadow, uv ) );
	}
	float VSMShadow (sampler2D shadow, vec2 uv, float compare ){
		float occlusion = 1.0;
		vec2 distribution = texture2DDistribution( shadow, uv );
		float hard_shadow = step( compare , distribution.x );
		if (hard_shadow != 1.0 ) {
			float distance = compare - distribution.x ;
			float variance = max( 0.00000, distribution.y * distribution.y );
			float softness_probability = variance / (variance + distance * distance );			softness_probability = clamp( ( softness_probability - 0.3 ) / ( 0.95 - 0.3 ), 0.0, 1.0 );			occlusion = clamp( max( hard_shadow, softness_probability ), 0.0, 1.0 );
		}
		return occlusion;
	}
	float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
		float shadow = 1.0;
		shadowCoord.xyz /= shadowCoord.w;
		shadowCoord.z += shadowBias;
		bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
		bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
		if ( frustumTest ) {
		#if defined( SHADOWMAP_TYPE_PCF )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx0 = - texelSize.x * shadowRadius;
			float dy0 = - texelSize.y * shadowRadius;
			float dx1 = + texelSize.x * shadowRadius;
			float dy1 = + texelSize.y * shadowRadius;
			float dx2 = dx0 / 2.0;
			float dy2 = dy0 / 2.0;
			float dx3 = dx1 / 2.0;
			float dy3 = dy1 / 2.0;
			shadow = (
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy1 ), shadowCoord.z )
			) * ( 1.0 / 17.0 );
		#elif defined( SHADOWMAP_TYPE_PCF_SOFT )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx = texelSize.x;
			float dy = texelSize.y;
			vec2 uv = shadowCoord.xy;
			vec2 f = fract( uv * shadowMapSize + 0.5 );
			uv -= f * texelSize;
			shadow = (
				texture2DCompare( shadowMap, uv, shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( dx, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( 0.0, dy ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + texelSize, shadowCoord.z ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, 0.0 ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 0.0 ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, dy ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( 0.0, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 0.0, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( texture2DCompare( shadowMap, uv + vec2( dx, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( dx, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( mix( texture2DCompare( shadowMap, uv + vec2( -dx, -dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, -dy ), shadowCoord.z ),
						  f.x ),
					 mix( texture2DCompare( shadowMap, uv + vec2( -dx, 2.0 * dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 2.0 * dy ), shadowCoord.z ),
						  f.x ),
					 f.y )
			) * ( 1.0 / 9.0 );
		#elif defined( SHADOWMAP_TYPE_VSM )
			shadow = VSMShadow( shadowMap, shadowCoord.xy, shadowCoord.z );
		#else
			shadow = texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z );
		#endif
		}
		return shadow;
	}
	vec2 cubeToUV( vec3 v, float texelSizeY ) {
		vec3 absV = abs( v );
		float scaleToCube = 1.0 / max( absV.x, max( absV.y, absV.z ) );
		absV *= scaleToCube;
		v *= scaleToCube * ( 1.0 - 2.0 * texelSizeY );
		vec2 planar = v.xy;
		float almostATexel = 1.5 * texelSizeY;
		float almostOne = 1.0 - almostATexel;
		if ( absV.z >= almostOne ) {
			if ( v.z > 0.0 )
				planar.x = 4.0 - v.x;
		} else if ( absV.x >= almostOne ) {
			float signX = sign( v.x );
			planar.x = v.z * signX + 2.0 * signX;
		} else if ( absV.y >= almostOne ) {
			float signY = sign( v.y );
			planar.x = v.x + 2.0 * signY + 2.0;
			planar.y = v.z * signY - 2.0;
		}
		return vec2( 0.125, 0.25 ) * planar + vec2( 0.375, 0.75 );
	}
	float getPointShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		
		float lightToPositionLength = length( lightToPosition );
		if ( lightToPositionLength - shadowCameraFar <= 0.0 && lightToPositionLength - shadowCameraNear >= 0.0 ) {
			float dp = ( lightToPositionLength - shadowCameraNear ) / ( shadowCameraFar - shadowCameraNear );			dp += shadowBias;
			vec3 bd3D = normalize( lightToPosition );
			vec2 texelSize = vec2( 1.0 ) / ( shadowMapSize * vec2( 4.0, 2.0 ) );
			#if defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_PCF_SOFT ) || defined( SHADOWMAP_TYPE_VSM )
				vec2 offset = vec2( - 1, 1 ) * shadowRadius * texelSize.y;
				shadow = (
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxx, texelSize.y ), dp )
				) * ( 1.0 / 9.0 );
			#else
				shadow = texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp );
			#endif
		}
		return shadow;
	}
#endif`,zp=`#if NUM_SPOT_LIGHT_COORDS > 0
	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		struct SpotLightShadow {
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
#endif`,Bp=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	vec3 shadowWorldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
	vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );
			vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
#endif
#if NUM_SPOT_LIGHT_COORDS > 0
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {
		shadowWorldPosition = worldPosition;
		#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
			shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;
		#endif
		vSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;
	}
	#pragma unroll_loop_end
#endif`,kp=`float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
		directionalLight = directionalLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {
		spotLight = spotLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
		pointLight = pointLightShadows[ i ];
		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#endif
	return shadow;
}`,Hp=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,Gp=`#ifdef USE_SKINNING
	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;
	uniform highp sampler2D boneTexture;
	mat4 getBoneMatrix( const in float i ) {
		int size = textureSize( boneTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( boneTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( boneTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( boneTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( boneTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`,Vp=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,Wp=`#ifdef USE_SKINNING
	mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += skinWeight.x * boneMatX;
	skinMatrix += skinWeight.y * boneMatY;
	skinMatrix += skinWeight.z * boneMatZ;
	skinMatrix += skinWeight.w * boneMatW;
	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;
	#ifdef USE_TANGENT
		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;
	#endif
#endif`,Xp=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,qp=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,Yp=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,jp=`#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
uniform float toneMappingExposure;
vec3 LinearToneMapping( vec3 color ) {
	return saturate( toneMappingExposure * color );
}
vec3 ReinhardToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );
}
vec3 OptimizedCineonToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );
}
vec3 RRTAndODTFit( vec3 v ) {
	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;
}
vec3 ACESFilmicToneMapping( vec3 color ) {
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ),		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ),		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);
	color *= toneMappingExposure / 0.6;
	color = ACESInputMat * color;
	color = RRTAndODTFit( color );
	color = ACESOutputMat * color;
	return saturate( color );
}
const mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(
	vec3( 1.6605, - 0.1246, - 0.0182 ),
	vec3( - 0.5876, 1.1329, - 0.1006 ),
	vec3( - 0.0728, - 0.0083, 1.1187 )
);
const mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(
	vec3( 0.6274, 0.0691, 0.0164 ),
	vec3( 0.3293, 0.9195, 0.0880 ),
	vec3( 0.0433, 0.0113, 0.8956 )
);
vec3 agxDefaultContrastApprox( vec3 x ) {
	vec3 x2 = x * x;
	vec3 x4 = x2 * x2;
	return + 15.5 * x4 * x2
		- 40.14 * x4 * x
		+ 31.96 * x4
		- 6.868 * x2 * x
		+ 0.4298 * x2
		+ 0.1191 * x
		- 0.00232;
}
vec3 AgXToneMapping( vec3 color ) {
	const mat3 AgXInsetMatrix = mat3(
		vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),
		vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),
		vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 )
	);
	const mat3 AgXOutsetMatrix = mat3(
		vec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),
		vec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),
		vec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 )
	);
	const float AgxMinEv = - 12.47393;	const float AgxMaxEv = 4.026069;
	color *= toneMappingExposure;
	color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;
	color = AgXInsetMatrix * color;
	color = max( color, 1e-10 );	color = log2( color );
	color = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );
	color = clamp( color, 0.0, 1.0 );
	color = agxDefaultContrastApprox( color );
	color = AgXOutsetMatrix * color;
	color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );
	color = LINEAR_REC2020_TO_LINEAR_SRGB * color;
	color = clamp( color, 0.0, 1.0 );
	return color;
}
vec3 NeutralToneMapping( vec3 color ) {
	const float StartCompression = 0.8 - 0.04;
	const float Desaturation = 0.15;
	color *= toneMappingExposure;
	float x = min( color.r, min( color.g, color.b ) );
	float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
	color -= offset;
	float peak = max( color.r, max( color.g, color.b ) );
	if ( peak < StartCompression ) return color;
	float d = 1. - StartCompression;
	float newPeak = 1. - d * d / ( peak + d - StartCompression );
	color *= newPeak / peak;
	float g = 1. - 1. / ( Desaturation * ( peak - newPeak ) + 1. );
	return mix( color, vec3( newPeak ), g );
}
vec3 CustomToneMapping( vec3 color ) { return color; }`,Kp=`#ifdef USE_TRANSMISSION
	material.transmission = transmission;
	material.transmissionAlpha = 1.0;
	material.thickness = thickness;
	material.attenuationDistance = attenuationDistance;
	material.attenuationColor = attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		material.transmission *= texture2D( transmissionMap, vTransmissionMapUv ).r;
	#endif
	#ifdef USE_THICKNESSMAP
		material.thickness *= texture2D( thicknessMap, vThicknessMapUv ).g;
	#endif
	vec3 pos = vWorldPosition;
	vec3 v = normalize( cameraPosition - pos );
	vec3 n = inverseTransformDirection( normal, viewMatrix );
	vec4 transmitted = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseColor, material.specularColor, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.dispersion, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );
	material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );
	totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );
#endif`,$p=`#ifdef USE_TRANSMISSION
	uniform float transmission;
	uniform float thickness;
	uniform float attenuationDistance;
	uniform vec3 attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		uniform sampler2D transmissionMap;
	#endif
	#ifdef USE_THICKNESSMAP
		uniform sampler2D thicknessMap;
	#endif
	uniform vec2 transmissionSamplerSize;
	uniform sampler2D transmissionSamplerMap;
	uniform mat4 modelMatrix;
	uniform mat4 projectionMatrix;
	varying vec3 vWorldPosition;
	float w0( float a ) {
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );
	}
	float w1( float a ) {
		return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );
	}
	float w2( float a ){
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );
	}
	float w3( float a ) {
		return ( 1.0 / 6.0 ) * ( a * a * a );
	}
	float g0( float a ) {
		return w0( a ) + w1( a );
	}
	float g1( float a ) {
		return w2( a ) + w3( a );
	}
	float h0( float a ) {
		return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );
	}
	float h1( float a ) {
		return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );
	}
	vec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, float lod ) {
		uv = uv * texelSize.zw + 0.5;
		vec2 iuv = floor( uv );
		vec2 fuv = fract( uv );
		float g0x = g0( fuv.x );
		float g1x = g1( fuv.x );
		float h0x = h0( fuv.x );
		float h1x = h1( fuv.x );
		float h0y = h0( fuv.y );
		float h1y = h1( fuv.y );
		vec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		vec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		return g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +
			g1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );
	}
	vec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {
		vec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );
		vec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );
		vec2 fLodSizeInv = 1.0 / fLodSize;
		vec2 cLodSizeInv = 1.0 / cLodSize;
		vec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), floor( lod ) );
		vec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), ceil( lod ) );
		return mix( fSample, cSample, fract( lod ) );
	}
	vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {
		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );
		vec3 modelScale;
		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );
		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );
		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );
		return normalize( refractionVector ) * thickness * modelScale;
	}
	float applyIorToRoughness( const in float roughness, const in float ior ) {
		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );
	}
	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {
		float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
		return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );
	}
	vec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {
		if ( isinf( attenuationDistance ) ) {
			return vec3( 1.0 );
		} else {
			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );			return transmittance;
		}
	}
	vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,
		const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,
		const in mat4 viewMatrix, const in mat4 projMatrix, const in float dispersion, const in float ior, const in float thickness,
		const in vec3 attenuationColor, const in float attenuationDistance ) {
		vec4 transmittedLight;
		vec3 transmittance;
		#ifdef USE_DISPERSION
			float halfSpread = ( ior - 1.0 ) * 0.025 * dispersion;
			vec3 iors = vec3( ior - halfSpread, ior, ior + halfSpread );
			for ( int i = 0; i < 3; i ++ ) {
				vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, iors[ i ], modelMatrix );
				vec3 refractedRayExit = position + transmissionRay;
		
				vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
				vec2 refractionCoords = ndcPos.xy / ndcPos.w;
				refractionCoords += 1.0;
				refractionCoords /= 2.0;
		
				vec4 transmissionSample = getTransmissionSample( refractionCoords, roughness, iors[ i ] );
				transmittedLight[ i ] = transmissionSample[ i ];
				transmittedLight.a += transmissionSample.a;
				transmittance[ i ] = diffuseColor[ i ] * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance )[ i ];
			}
			transmittedLight.a /= 3.0;
		
		#else
		
			vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
			vec3 refractedRayExit = position + transmissionRay;
			vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
			vec2 refractionCoords = ndcPos.xy / ndcPos.w;
			refractionCoords += 1.0;
			refractionCoords /= 2.0;
			transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
			transmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );
		
		#endif
		vec3 attenuatedColor = transmittance * transmittedLight.rgb;
		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );
		float transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;
		return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );
	}
#endif`,Zp=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_SPECULARMAP
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,Jp=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	uniform mat3 mapTransform;
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	uniform mat3 alphaMapTransform;
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	uniform mat3 lightMapTransform;
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	uniform mat3 aoMapTransform;
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	uniform mat3 bumpMapTransform;
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	uniform mat3 normalMapTransform;
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_DISPLACEMENTMAP
	uniform mat3 displacementMapTransform;
	varying vec2 vDisplacementMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	uniform mat3 emissiveMapTransform;
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	uniform mat3 metalnessMapTransform;
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	uniform mat3 roughnessMapTransform;
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	uniform mat3 anisotropyMapTransform;
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	uniform mat3 clearcoatMapTransform;
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform mat3 clearcoatNormalMapTransform;
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform mat3 clearcoatRoughnessMapTransform;
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	uniform mat3 sheenColorMapTransform;
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	uniform mat3 sheenRoughnessMapTransform;
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	uniform mat3 iridescenceMapTransform;
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform mat3 iridescenceThicknessMapTransform;
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SPECULARMAP
	uniform mat3 specularMapTransform;
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	uniform mat3 specularColorMapTransform;
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	uniform mat3 specularIntensityMapTransform;
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,Qp=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	vUv = vec3( uv, 1 ).xy;
#endif
#ifdef USE_MAP
	vMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ALPHAMAP
	vAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_LIGHTMAP
	vLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_AOMAP
	vAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_BUMPMAP
	vBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_NORMALMAP
	vNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DISPLACEMENTMAP
	vDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_EMISSIVEMAP
	vEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_METALNESSMAP
	vMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ROUGHNESSMAP
	vRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ANISOTROPYMAP
	vAnisotropyMapUv = ( anisotropyMapTransform * vec3( ANISOTROPYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOATMAP
	vClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	vClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	vClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCEMAP
	vIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	vIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_COLORMAP
	vSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	vSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULARMAP
	vSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_COLORMAP
	vSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	vSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_TRANSMISSIONMAP
	vTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_THICKNESSMAP
	vThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;
#endif`,tm=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`;const em=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,nm=`uniform sampler2D t2D;
uniform float backgroundIntensity;
varying vec2 vUv;
void main() {
	vec4 texColor = texture2D( t2D, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,im=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,sm=`#ifdef ENVMAP_TYPE_CUBE
	uniform samplerCube envMap;
#elif defined( ENVMAP_TYPE_CUBE_UV )
	uniform sampler2D envMap;
#endif
uniform float flipEnvMap;
uniform float backgroundBlurriness;
uniform float backgroundIntensity;
uniform mat3 backgroundRotation;
varying vec3 vWorldDirection;
#include <cube_uv_reflection_fragment>
void main() {
	#ifdef ENVMAP_TYPE_CUBE
		vec4 texColor = textureCube( envMap, backgroundRotation * vec3( flipEnvMap * vWorldDirection.x, vWorldDirection.yz ) );
	#elif defined( ENVMAP_TYPE_CUBE_UV )
		vec4 texColor = textureCubeUV( envMap, backgroundRotation * vWorldDirection, backgroundBlurriness );
	#else
		vec4 texColor = vec4( 0.0, 0.0, 0.0, 1.0 );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,rm=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,om=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,am=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
varying vec2 vHighPrecisionZW;
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vHighPrecisionZW = gl_Position.zw;
}`,lm=`#if DEPTH_PACKING == 3200
	uniform float opacity;
#endif
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
varying vec2 vHighPrecisionZW;
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#if DEPTH_PACKING == 3200
		diffuseColor.a = opacity;
	#endif
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <logdepthbuf_fragment>
	float fragCoordZ = 0.5 * vHighPrecisionZW[0] / vHighPrecisionZW[1] + 0.5;
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#endif
}`,cm=`#define DISTANCE
varying vec3 vWorldPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <clipping_planes_vertex>
	vWorldPosition = worldPosition.xyz;
}`,um=`#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <clipping_planes_pars_fragment>
void main () {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = packDepthToRGBA( dist );
}`,hm=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,fm=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,dm=`uniform float scale;
attribute float lineDistance;
varying float vLineDistance;
#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	vLineDistance = scale * lineDistance;
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,pm=`uniform vec3 diffuse;
uniform float opacity;
uniform float dashSize;
uniform float totalSize;
varying float vLineDistance;
#include <common>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	if ( mod( vLineDistance, totalSize ) > dashSize ) {
		discard;
	}
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,mm=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}`,gm=`uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	#else
		reflectedLight.indirectDiffuse += vec3( 1.0 );
	#endif
	#include <aomap_fragment>
	reflectedLight.indirectDiffuse *= diffuseColor.rgb;
	vec3 outgoingLight = reflectedLight.indirectDiffuse;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,_m=`#define LAMBERT
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,xm=`#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_lambert_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_lambert_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,vm=`#define MATCAP
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
	vViewPosition = - mvPosition.xyz;
}`,Mm=`#define MATCAP
uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D matcap;
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	vec3 viewDir = normalize( vViewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;
	#ifdef USE_MATCAP
		vec4 matcapColor = texture2D( matcap, uv );
	#else
		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );
	#endif
	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Sm=`#define NORMAL
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	vViewPosition = - mvPosition.xyz;
#endif
}`,ym=`#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <packing>
#include <uv_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 0.0, 0.0, 0.0, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	gl_FragColor = vec4( packNormalToRGB( normal ), diffuseColor.a );
	#ifdef OPAQUE
		gl_FragColor.a = 1.0;
	#endif
}`,Em=`#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,Tm=`#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,bm=`#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
	varying vec3 vWorldPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
#ifdef USE_TRANSMISSION
	vWorldPosition = worldPosition.xyz;
#endif
}`,Am=`#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
	uniform float ior;
#endif
#ifdef USE_SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;
	#ifdef USE_SPECULAR_COLORMAP
		uniform sampler2D specularColorMap;
	#endif
	#ifdef USE_SPECULAR_INTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
#endif
#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif
#ifdef USE_DISPERSION
	uniform float dispersion;
#endif
#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;
	#ifdef USE_SHEEN_COLORMAP
		uniform sampler2D sheenColorMap;
	#endif
	#ifdef USE_SHEEN_ROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif
#ifdef USE_ANISOTROPY
	uniform vec2 anisotropyVector;
	#ifdef USE_ANISOTROPYMAP
		uniform sampler2D anisotropyMap;
	#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	#include <transmission_fragment>
	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
	#ifdef USE_SHEEN
		float sheenEnergyComp = 1.0 - 0.157 * max3( material.sheenColor );
		outgoingLight = outgoingLight * sheenEnergyComp + sheenSpecularDirect + sheenSpecularIndirect;
	#endif
	#ifdef USE_CLEARCOAT
		float dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );
		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;
	#endif
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,wm=`#define TOON
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,Rm=`#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_toon_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Cm=`uniform float size;
uniform float scale;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#ifdef USE_POINTS_UV
	varying vec2 vUv;
	uniform mat3 uvTransform;
#endif
void main() {
	#ifdef USE_POINTS_UV
		vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	#endif
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	gl_PointSize = size;
	#ifdef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
	#endif
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>
}`,Pm=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,Lm=`#include <common>
#include <batching_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <shadowmap_pars_vertex>
void main() {
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,Dm=`uniform vec3 color;
uniform float opacity;
#include <common>
#include <packing>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <logdepthbuf_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
void main() {
	#include <logdepthbuf_fragment>
	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,Um=`uniform float rotation;
uniform vec2 center;
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	vec4 mvPosition = modelViewMatrix * vec4( 0.0, 0.0, 0.0, 1.0 );
	vec2 scale;
	scale.x = length( vec3( modelMatrix[ 0 ].x, modelMatrix[ 0 ].y, modelMatrix[ 0 ].z ) );
	scale.y = length( vec3( modelMatrix[ 1 ].x, modelMatrix[ 1 ].y, modelMatrix[ 1 ].z ) );
	#ifndef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) scale *= - mvPosition.z;
	#endif
	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;
	vec2 rotatedPosition;
	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
	mvPosition.xy += rotatedPosition;
	gl_Position = projectionMatrix * mvPosition;
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,Im=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,Gt={alphahash_fragment:nd,alphahash_pars_fragment:id,alphamap_fragment:sd,alphamap_pars_fragment:rd,alphatest_fragment:od,alphatest_pars_fragment:ad,aomap_fragment:ld,aomap_pars_fragment:cd,batching_pars_vertex:ud,batching_vertex:hd,begin_vertex:fd,beginnormal_vertex:dd,bsdfs:pd,iridescence_fragment:md,bumpmap_pars_fragment:gd,clipping_planes_fragment:_d,clipping_planes_pars_fragment:xd,clipping_planes_pars_vertex:vd,clipping_planes_vertex:Md,color_fragment:Sd,color_pars_fragment:yd,color_pars_vertex:Ed,color_vertex:Td,common:bd,cube_uv_reflection_fragment:Ad,defaultnormal_vertex:wd,displacementmap_pars_vertex:Rd,displacementmap_vertex:Cd,emissivemap_fragment:Pd,emissivemap_pars_fragment:Ld,colorspace_fragment:Dd,colorspace_pars_fragment:Ud,envmap_fragment:Id,envmap_common_pars_fragment:Nd,envmap_pars_fragment:Fd,envmap_pars_vertex:Od,envmap_physical_pars_fragment:jd,envmap_vertex:zd,fog_vertex:Bd,fog_pars_vertex:kd,fog_fragment:Hd,fog_pars_fragment:Gd,gradientmap_pars_fragment:Vd,lightmap_pars_fragment:Wd,lights_lambert_fragment:Xd,lights_lambert_pars_fragment:qd,lights_pars_begin:Yd,lights_toon_fragment:Kd,lights_toon_pars_fragment:$d,lights_phong_fragment:Zd,lights_phong_pars_fragment:Jd,lights_physical_fragment:Qd,lights_physical_pars_fragment:tp,lights_fragment_begin:ep,lights_fragment_maps:np,lights_fragment_end:ip,logdepthbuf_fragment:sp,logdepthbuf_pars_fragment:rp,logdepthbuf_pars_vertex:op,logdepthbuf_vertex:ap,map_fragment:lp,map_pars_fragment:cp,map_particle_fragment:up,map_particle_pars_fragment:hp,metalnessmap_fragment:fp,metalnessmap_pars_fragment:dp,morphinstance_vertex:pp,morphcolor_vertex:mp,morphnormal_vertex:gp,morphtarget_pars_vertex:_p,morphtarget_vertex:xp,normal_fragment_begin:vp,normal_fragment_maps:Mp,normal_pars_fragment:Sp,normal_pars_vertex:yp,normal_vertex:Ep,normalmap_pars_fragment:Tp,clearcoat_normal_fragment_begin:bp,clearcoat_normal_fragment_maps:Ap,clearcoat_pars_fragment:wp,iridescence_pars_fragment:Rp,opaque_fragment:Cp,packing:Pp,premultiplied_alpha_fragment:Lp,project_vertex:Dp,dithering_fragment:Up,dithering_pars_fragment:Ip,roughnessmap_fragment:Np,roughnessmap_pars_fragment:Fp,shadowmap_pars_fragment:Op,shadowmap_pars_vertex:zp,shadowmap_vertex:Bp,shadowmask_pars_fragment:kp,skinbase_vertex:Hp,skinning_pars_vertex:Gp,skinning_vertex:Vp,skinnormal_vertex:Wp,specularmap_fragment:Xp,specularmap_pars_fragment:qp,tonemapping_fragment:Yp,tonemapping_pars_fragment:jp,transmission_fragment:Kp,transmission_pars_fragment:$p,uv_pars_fragment:Zp,uv_pars_vertex:Jp,uv_vertex:Qp,worldpos_vertex:tm,background_vert:em,background_frag:nm,backgroundCube_vert:im,backgroundCube_frag:sm,cube_vert:rm,cube_frag:om,depth_vert:am,depth_frag:lm,distanceRGBA_vert:cm,distanceRGBA_frag:um,equirect_vert:hm,equirect_frag:fm,linedashed_vert:dm,linedashed_frag:pm,meshbasic_vert:mm,meshbasic_frag:gm,meshlambert_vert:_m,meshlambert_frag:xm,meshmatcap_vert:vm,meshmatcap_frag:Mm,meshnormal_vert:Sm,meshnormal_frag:ym,meshphong_vert:Em,meshphong_frag:Tm,meshphysical_vert:bm,meshphysical_frag:Am,meshtoon_vert:wm,meshtoon_frag:Rm,points_vert:Cm,points_frag:Pm,shadow_vert:Lm,shadow_frag:Dm,sprite_vert:Um,sprite_frag:Im},ut={common:{diffuse:{value:new jt(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new Vt},alphaMap:{value:null},alphaMapTransform:{value:new Vt},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new Vt}},envmap:{envMap:{value:null},envMapRotation:{value:new Vt},flipEnvMap:{value:-1},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new Vt}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new Vt}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new Vt},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new Vt},normalScale:{value:new At(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new Vt},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new Vt}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new Vt}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new Vt}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new jt(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMap:{value:[]},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotShadowMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMap:{value:[]},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null}},points:{diffuse:{value:new jt(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new Vt},alphaTest:{value:0},uvTransform:{value:new Vt}},sprite:{diffuse:{value:new jt(16777215)},opacity:{value:1},center:{value:new At(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new Vt},alphaMap:{value:null},alphaMapTransform:{value:new Vt},alphaTest:{value:0}}},yn={basic:{uniforms:Ie([ut.common,ut.specularmap,ut.envmap,ut.aomap,ut.lightmap,ut.fog]),vertexShader:Gt.meshbasic_vert,fragmentShader:Gt.meshbasic_frag},lambert:{uniforms:Ie([ut.common,ut.specularmap,ut.envmap,ut.aomap,ut.lightmap,ut.emissivemap,ut.bumpmap,ut.normalmap,ut.displacementmap,ut.fog,ut.lights,{emissive:{value:new jt(0)}}]),vertexShader:Gt.meshlambert_vert,fragmentShader:Gt.meshlambert_frag},phong:{uniforms:Ie([ut.common,ut.specularmap,ut.envmap,ut.aomap,ut.lightmap,ut.emissivemap,ut.bumpmap,ut.normalmap,ut.displacementmap,ut.fog,ut.lights,{emissive:{value:new jt(0)},specular:{value:new jt(1118481)},shininess:{value:30}}]),vertexShader:Gt.meshphong_vert,fragmentShader:Gt.meshphong_frag},standard:{uniforms:Ie([ut.common,ut.envmap,ut.aomap,ut.lightmap,ut.emissivemap,ut.bumpmap,ut.normalmap,ut.displacementmap,ut.roughnessmap,ut.metalnessmap,ut.fog,ut.lights,{emissive:{value:new jt(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:Gt.meshphysical_vert,fragmentShader:Gt.meshphysical_frag},toon:{uniforms:Ie([ut.common,ut.aomap,ut.lightmap,ut.emissivemap,ut.bumpmap,ut.normalmap,ut.displacementmap,ut.gradientmap,ut.fog,ut.lights,{emissive:{value:new jt(0)}}]),vertexShader:Gt.meshtoon_vert,fragmentShader:Gt.meshtoon_frag},matcap:{uniforms:Ie([ut.common,ut.bumpmap,ut.normalmap,ut.displacementmap,ut.fog,{matcap:{value:null}}]),vertexShader:Gt.meshmatcap_vert,fragmentShader:Gt.meshmatcap_frag},points:{uniforms:Ie([ut.points,ut.fog]),vertexShader:Gt.points_vert,fragmentShader:Gt.points_frag},dashed:{uniforms:Ie([ut.common,ut.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:Gt.linedashed_vert,fragmentShader:Gt.linedashed_frag},depth:{uniforms:Ie([ut.common,ut.displacementmap]),vertexShader:Gt.depth_vert,fragmentShader:Gt.depth_frag},normal:{uniforms:Ie([ut.common,ut.bumpmap,ut.normalmap,ut.displacementmap,{opacity:{value:1}}]),vertexShader:Gt.meshnormal_vert,fragmentShader:Gt.meshnormal_frag},sprite:{uniforms:Ie([ut.sprite,ut.fog]),vertexShader:Gt.sprite_vert,fragmentShader:Gt.sprite_frag},background:{uniforms:{uvTransform:{value:new Vt},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:Gt.background_vert,fragmentShader:Gt.background_frag},backgroundCube:{uniforms:{envMap:{value:null},flipEnvMap:{value:-1},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new Vt}},vertexShader:Gt.backgroundCube_vert,fragmentShader:Gt.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:Gt.cube_vert,fragmentShader:Gt.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:Gt.equirect_vert,fragmentShader:Gt.equirect_frag},distanceRGBA:{uniforms:Ie([ut.common,ut.displacementmap,{referencePosition:{value:new I},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:Gt.distanceRGBA_vert,fragmentShader:Gt.distanceRGBA_frag},shadow:{uniforms:Ie([ut.lights,ut.fog,{color:{value:new jt(0)},opacity:{value:1}}]),vertexShader:Gt.shadow_vert,fragmentShader:Gt.shadow_frag}};yn.physical={uniforms:Ie([yn.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new Vt},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new Vt},clearcoatNormalScale:{value:new At(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new Vt},dispersion:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new Vt},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new Vt},sheen:{value:0},sheenColor:{value:new jt(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new Vt},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new Vt},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new Vt},transmissionSamplerSize:{value:new At},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new Vt},attenuationDistance:{value:0},attenuationColor:{value:new jt(0)},specularColor:{value:new jt(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new Vt},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new Vt},anisotropyVector:{value:new At},anisotropyMap:{value:null},anisotropyMapTransform:{value:new Vt}}]),vertexShader:Gt.meshphysical_vert,fragmentShader:Gt.meshphysical_frag};const Sr={r:0,b:0,g:0},vi=new Rn,Nm=new Kt;function Fm(i,t,e,n,s,r,o){const a=new jt(0);let l=r===!0?0:1,c,h,f=null,u=0,d=null;function g(M){let x=M.isScene===!0?M.background:null;return x&&x.isTexture&&(x=(M.backgroundBlurriness>0?e:t).get(x)),x}function _(M){let x=!1;const E=g(M);E===null?p(a,l):E&&E.isColor&&(p(E,1),x=!0);const A=i.xr.getEnvironmentBlendMode();A==="additive"?n.buffers.color.setClear(0,0,0,1,o):A==="alpha-blend"&&n.buffers.color.setClear(0,0,0,0,o),(i.autoClear||x)&&(n.buffers.depth.setTest(!0),n.buffers.depth.setMask(!0),n.buffers.color.setMask(!0),i.clear(i.autoClearColor,i.autoClearDepth,i.autoClearStencil))}function m(M,x){const E=g(x);E&&(E.isCubeTexture||E.mapping===uo)?(h===void 0&&(h=new me(new Cn(1,1,1),new ci({name:"BackgroundCubeMaterial",uniforms:Es(yn.backgroundCube.uniforms),vertexShader:yn.backgroundCube.vertexShader,fragmentShader:yn.backgroundCube.fragmentShader,side:Fe,depthTest:!1,depthWrite:!1,fog:!1})),h.geometry.deleteAttribute("normal"),h.geometry.deleteAttribute("uv"),h.onBeforeRender=function(A,b,S){this.matrixWorld.copyPosition(S.matrixWorld)},Object.defineProperty(h.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),s.update(h)),vi.copy(x.backgroundRotation),vi.x*=-1,vi.y*=-1,vi.z*=-1,E.isCubeTexture&&E.isRenderTargetTexture===!1&&(vi.y*=-1,vi.z*=-1),h.material.uniforms.envMap.value=E,h.material.uniforms.flipEnvMap.value=E.isCubeTexture&&E.isRenderTargetTexture===!1?-1:1,h.material.uniforms.backgroundBlurriness.value=x.backgroundBlurriness,h.material.uniforms.backgroundIntensity.value=x.backgroundIntensity,h.material.uniforms.backgroundRotation.value.setFromMatrix4(Nm.makeRotationFromEuler(vi)),h.material.toneMapped=ne.getTransfer(E.colorSpace)!==oe,(f!==E||u!==E.version||d!==i.toneMapping)&&(h.material.needsUpdate=!0,f=E,u=E.version,d=i.toneMapping),h.layers.enableAll(),M.unshift(h,h.geometry,h.material,0,0,null)):E&&E.isTexture&&(c===void 0&&(c=new me(new Qs(2,2),new ci({name:"BackgroundMaterial",uniforms:Es(yn.background.uniforms),vertexShader:yn.background.vertexShader,fragmentShader:yn.background.fragmentShader,side:wn,depthTest:!1,depthWrite:!1,fog:!1})),c.geometry.deleteAttribute("normal"),Object.defineProperty(c.material,"map",{get:function(){return this.uniforms.t2D.value}}),s.update(c)),c.material.uniforms.t2D.value=E,c.material.uniforms.backgroundIntensity.value=x.backgroundIntensity,c.material.toneMapped=ne.getTransfer(E.colorSpace)!==oe,E.matrixAutoUpdate===!0&&E.updateMatrix(),c.material.uniforms.uvTransform.value.copy(E.matrix),(f!==E||u!==E.version||d!==i.toneMapping)&&(c.material.needsUpdate=!0,f=E,u=E.version,d=i.toneMapping),c.layers.enableAll(),M.unshift(c,c.geometry,c.material,0,0,null))}function p(M,x){M.getRGB(Sr,Nu(i)),n.buffers.color.setClear(Sr.r,Sr.g,Sr.b,x,o)}return{getClearColor:function(){return a},setClearColor:function(M,x=1){a.set(M),l=x,p(a,l)},getClearAlpha:function(){return l},setClearAlpha:function(M){l=M,p(a,l)},render:_,addToRenderList:m}}function Om(i,t){const e=i.getParameter(i.MAX_VERTEX_ATTRIBS),n={},s=u(null);let r=s,o=!1;function a(v,R,L,D,N){let z=!1;const O=f(D,L,R);r!==O&&(r=O,c(r.object)),z=d(v,D,L,N),z&&g(v,D,L,N),N!==null&&t.update(N,i.ELEMENT_ARRAY_BUFFER),(z||o)&&(o=!1,E(v,R,L,D),N!==null&&i.bindBuffer(i.ELEMENT_ARRAY_BUFFER,t.get(N).buffer))}function l(){return i.createVertexArray()}function c(v){return i.bindVertexArray(v)}function h(v){return i.deleteVertexArray(v)}function f(v,R,L){const D=L.wireframe===!0;let N=n[v.id];N===void 0&&(N={},n[v.id]=N);let z=N[R.id];z===void 0&&(z={},N[R.id]=z);let O=z[D];return O===void 0&&(O=u(l()),z[D]=O),O}function u(v){const R=[],L=[],D=[];for(let N=0;N<e;N++)R[N]=0,L[N]=0,D[N]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:R,enabledAttributes:L,attributeDivisors:D,object:v,attributes:{},index:null}}function d(v,R,L,D){const N=r.attributes,z=R.attributes;let O=0;const Y=L.getAttributes();for(const B in Y)if(Y[B].location>=0){const st=N[B];let ht=z[B];if(ht===void 0&&(B==="instanceMatrix"&&v.instanceMatrix&&(ht=v.instanceMatrix),B==="instanceColor"&&v.instanceColor&&(ht=v.instanceColor)),st===void 0||st.attribute!==ht||ht&&st.data!==ht.data)return!0;O++}return r.attributesNum!==O||r.index!==D}function g(v,R,L,D){const N={},z=R.attributes;let O=0;const Y=L.getAttributes();for(const B in Y)if(Y[B].location>=0){let st=z[B];st===void 0&&(B==="instanceMatrix"&&v.instanceMatrix&&(st=v.instanceMatrix),B==="instanceColor"&&v.instanceColor&&(st=v.instanceColor));const ht={};ht.attribute=st,st&&st.data&&(ht.data=st.data),N[B]=ht,O++}r.attributes=N,r.attributesNum=O,r.index=D}function _(){const v=r.newAttributes;for(let R=0,L=v.length;R<L;R++)v[R]=0}function m(v){p(v,0)}function p(v,R){const L=r.newAttributes,D=r.enabledAttributes,N=r.attributeDivisors;L[v]=1,D[v]===0&&(i.enableVertexAttribArray(v),D[v]=1),N[v]!==R&&(i.vertexAttribDivisor(v,R),N[v]=R)}function M(){const v=r.newAttributes,R=r.enabledAttributes;for(let L=0,D=R.length;L<D;L++)R[L]!==v[L]&&(i.disableVertexAttribArray(L),R[L]=0)}function x(v,R,L,D,N,z,O){O===!0?i.vertexAttribIPointer(v,R,L,N,z):i.vertexAttribPointer(v,R,L,D,N,z)}function E(v,R,L,D){_();const N=D.attributes,z=L.getAttributes(),O=R.defaultAttributeValues;for(const Y in z){const B=z[Y];if(B.location>=0){let it=N[Y];if(it===void 0&&(Y==="instanceMatrix"&&v.instanceMatrix&&(it=v.instanceMatrix),Y==="instanceColor"&&v.instanceColor&&(it=v.instanceColor)),it!==void 0){const st=it.normalized,ht=it.itemSize,Pt=t.get(it);if(Pt===void 0)continue;const Wt=Pt.buffer,K=Pt.type,et=Pt.bytesPerElement,pt=K===i.INT||K===i.UNSIGNED_INT||it.gpuType===vu;if(it.isInterleavedBufferAttribute){const lt=it.data,Ot=lt.stride,Rt=it.offset;if(lt.isInstancedInterleavedBuffer){for(let Xt=0;Xt<B.locationSize;Xt++)p(B.location+Xt,lt.meshPerAttribute);v.isInstancedMesh!==!0&&D._maxInstanceCount===void 0&&(D._maxInstanceCount=lt.meshPerAttribute*lt.count)}else for(let Xt=0;Xt<B.locationSize;Xt++)m(B.location+Xt);i.bindBuffer(i.ARRAY_BUFFER,Wt);for(let Xt=0;Xt<B.locationSize;Xt++)x(B.location+Xt,ht/B.locationSize,K,st,Ot*et,(Rt+ht/B.locationSize*Xt)*et,pt)}else{if(it.isInstancedBufferAttribute){for(let lt=0;lt<B.locationSize;lt++)p(B.location+lt,it.meshPerAttribute);v.isInstancedMesh!==!0&&D._maxInstanceCount===void 0&&(D._maxInstanceCount=it.meshPerAttribute*it.count)}else for(let lt=0;lt<B.locationSize;lt++)m(B.location+lt);i.bindBuffer(i.ARRAY_BUFFER,Wt);for(let lt=0;lt<B.locationSize;lt++)x(B.location+lt,ht/B.locationSize,K,st,ht*et,ht/B.locationSize*lt*et,pt)}}else if(O!==void 0){const st=O[Y];if(st!==void 0)switch(st.length){case 2:i.vertexAttrib2fv(B.location,st);break;case 3:i.vertexAttrib3fv(B.location,st);break;case 4:i.vertexAttrib4fv(B.location,st);break;default:i.vertexAttrib1fv(B.location,st)}}}}M()}function A(){P();for(const v in n){const R=n[v];for(const L in R){const D=R[L];for(const N in D)h(D[N].object),delete D[N];delete R[L]}delete n[v]}}function b(v){if(n[v.id]===void 0)return;const R=n[v.id];for(const L in R){const D=R[L];for(const N in D)h(D[N].object),delete D[N];delete R[L]}delete n[v.id]}function S(v){for(const R in n){const L=n[R];if(L[v.id]===void 0)continue;const D=L[v.id];for(const N in D)h(D[N].object),delete D[N];delete L[v.id]}}function P(){T(),o=!0,r!==s&&(r=s,c(r.object))}function T(){s.geometry=null,s.program=null,s.wireframe=!1}return{setup:a,reset:P,resetDefaultState:T,dispose:A,releaseStatesOfGeometry:b,releaseStatesOfProgram:S,initAttributes:_,enableAttribute:m,disableUnusedAttributes:M}}function zm(i,t,e){let n;function s(c){n=c}function r(c,h){i.drawArrays(n,c,h),e.update(h,n,1)}function o(c,h,f){f!==0&&(i.drawArraysInstanced(n,c,h,f),e.update(h,n,f))}function a(c,h,f){if(f===0)return;const u=t.get("WEBGL_multi_draw");if(u===null)for(let d=0;d<f;d++)this.render(c[d],h[d]);else{u.multiDrawArraysWEBGL(n,c,0,h,0,f);let d=0;for(let g=0;g<f;g++)d+=h[g];e.update(d,n,1)}}function l(c,h,f,u){if(f===0)return;const d=t.get("WEBGL_multi_draw");if(d===null)for(let g=0;g<c.length;g++)o(c[g],h[g],u[g]);else{d.multiDrawArraysInstancedWEBGL(n,c,0,h,0,u,0,f);let g=0;for(let _=0;_<f;_++)g+=h[_];for(let _=0;_<u.length;_++)e.update(g,n,u[_])}}this.setMode=s,this.render=r,this.renderInstances=o,this.renderMultiDraw=a,this.renderMultiDrawInstances=l}function Bm(i,t,e,n){let s;function r(){if(s!==void 0)return s;if(t.has("EXT_texture_filter_anisotropic")===!0){const b=t.get("EXT_texture_filter_anisotropic");s=i.getParameter(b.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else s=0;return s}function o(b){return!(b!==bn&&n.convert(b)!==i.getParameter(i.IMPLEMENTATION_COLOR_READ_FORMAT))}function a(b){const S=b===ho&&(t.has("EXT_color_buffer_half_float")||t.has("EXT_color_buffer_float"));return!(b!==li&&n.convert(b)!==i.getParameter(i.IMPLEMENTATION_COLOR_READ_TYPE)&&b!==ni&&!S)}function l(b){if(b==="highp"){if(i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.HIGH_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.HIGH_FLOAT).precision>0)return"highp";b="mediump"}return b==="mediump"&&i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.MEDIUM_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let c=e.precision!==void 0?e.precision:"highp";const h=l(c);h!==c&&(console.warn("THREE.WebGLRenderer:",c,"not supported, using",h,"instead."),c=h);const f=e.logarithmicDepthBuffer===!0,u=i.getParameter(i.MAX_TEXTURE_IMAGE_UNITS),d=i.getParameter(i.MAX_VERTEX_TEXTURE_IMAGE_UNITS),g=i.getParameter(i.MAX_TEXTURE_SIZE),_=i.getParameter(i.MAX_CUBE_MAP_TEXTURE_SIZE),m=i.getParameter(i.MAX_VERTEX_ATTRIBS),p=i.getParameter(i.MAX_VERTEX_UNIFORM_VECTORS),M=i.getParameter(i.MAX_VARYING_VECTORS),x=i.getParameter(i.MAX_FRAGMENT_UNIFORM_VECTORS),E=d>0,A=i.getParameter(i.MAX_SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:r,getMaxPrecision:l,textureFormatReadable:o,textureTypeReadable:a,precision:c,logarithmicDepthBuffer:f,maxTextures:u,maxVertexTextures:d,maxTextureSize:g,maxCubemapSize:_,maxAttributes:m,maxVertexUniforms:p,maxVaryings:M,maxFragmentUniforms:x,vertexTextures:E,maxSamples:A}}function km(i){const t=this;let e=null,n=0,s=!1,r=!1;const o=new _n,a=new Vt,l={value:null,needsUpdate:!1};this.uniform=l,this.numPlanes=0,this.numIntersection=0,this.init=function(f,u){const d=f.length!==0||u||n!==0||s;return s=u,n=f.length,d},this.beginShadows=function(){r=!0,h(null)},this.endShadows=function(){r=!1},this.setGlobalState=function(f,u){e=h(f,u,0)},this.setState=function(f,u,d){const g=f.clippingPlanes,_=f.clipIntersection,m=f.clipShadows,p=i.get(f);if(!s||g===null||g.length===0||r&&!m)r?h(null):c();else{const M=r?0:n,x=M*4;let E=p.clippingState||null;l.value=E,E=h(g,u,x,d);for(let A=0;A!==x;++A)E[A]=e[A];p.clippingState=E,this.numIntersection=_?this.numPlanes:0,this.numPlanes+=M}};function c(){l.value!==e&&(l.value=e,l.needsUpdate=n>0),t.numPlanes=n,t.numIntersection=0}function h(f,u,d,g){const _=f!==null?f.length:0;let m=null;if(_!==0){if(m=l.value,g!==!0||m===null){const p=d+_*4,M=u.matrixWorldInverse;a.getNormalMatrix(M),(m===null||m.length<p)&&(m=new Float32Array(p));for(let x=0,E=d;x!==_;++x,E+=4)o.copy(f[x]).applyMatrix4(M,a),o.normal.toArray(m,E),m[E+3]=o.constant}l.value=m,l.needsUpdate=!0}return t.numPlanes=_,t.numIntersection=0,m}}function Hm(i){let t=new WeakMap;function e(o,a){return a===ya?o.mapping=xs:a===Ea&&(o.mapping=vs),o}function n(o){if(o&&o.isTexture){const a=o.mapping;if(a===ya||a===Ea)if(t.has(o)){const l=t.get(o).texture;return e(l,o.mapping)}else{const l=o.image;if(l&&l.height>0){const c=new Jf(l.height);return c.fromEquirectangularTexture(i,o),t.set(o,c),o.addEventListener("dispose",s),e(c.texture,o.mapping)}else return null}}return o}function s(o){const a=o.target;a.removeEventListener("dispose",s);const l=t.get(a);l!==void 0&&(t.delete(a),l.dispose())}function r(){t=new WeakMap}return{get:n,dispose:r}}class Bu extends Fu{constructor(t=-1,e=1,n=1,s=-1,r=.1,o=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=t,this.right=e,this.top=n,this.bottom=s,this.near=r,this.far=o,this.updateProjectionMatrix()}copy(t,e){return super.copy(t,e),this.left=t.left,this.right=t.right,this.top=t.top,this.bottom=t.bottom,this.near=t.near,this.far=t.far,this.zoom=t.zoom,this.view=t.view===null?null:Object.assign({},t.view),this}setViewOffset(t,e,n,s,r,o){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=t,this.view.fullHeight=e,this.view.offsetX=n,this.view.offsetY=s,this.view.width=r,this.view.height=o,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const t=(this.right-this.left)/(2*this.zoom),e=(this.top-this.bottom)/(2*this.zoom),n=(this.right+this.left)/2,s=(this.top+this.bottom)/2;let r=n-t,o=n+t,a=s+e,l=s-e;if(this.view!==null&&this.view.enabled){const c=(this.right-this.left)/this.view.fullWidth/this.zoom,h=(this.top-this.bottom)/this.view.fullHeight/this.zoom;r+=c*this.view.offsetX,o=r+c*this.view.width,a-=h*this.view.offsetY,l=a-h*this.view.height}this.projectionMatrix.makeOrthographic(r,o,a,l,this.near,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(t){const e=super.toJSON(t);return e.object.zoom=this.zoom,e.object.left=this.left,e.object.right=this.right,e.object.top=this.top,e.object.bottom=this.bottom,e.object.near=this.near,e.object.far=this.far,this.view!==null&&(e.object.view=Object.assign({},this.view)),e}}const hs=4,Zl=[.125,.215,.35,.446,.526,.582],Ti=20,Yo=new Bu,Jl=new jt;let jo=null,Ko=0,$o=0,Zo=!1;const Si=(1+Math.sqrt(5))/2,Ji=1/Si,Ql=[new I(-Si,Ji,0),new I(Si,Ji,0),new I(-Ji,0,Si),new I(Ji,0,Si),new I(0,Si,-Ji),new I(0,Si,Ji),new I(-1,1,-1),new I(1,1,-1),new I(-1,1,1),new I(1,1,1)];class tc{constructor(t){this._renderer=t,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._lodPlanes=[],this._sizeLods=[],this._sigmas=[],this._blurMaterial=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._compileMaterial(this._blurMaterial)}fromScene(t,e=0,n=.1,s=100){jo=this._renderer.getRenderTarget(),Ko=this._renderer.getActiveCubeFace(),$o=this._renderer.getActiveMipmapLevel(),Zo=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(256);const r=this._allocateTargets();return r.depthBuffer=!0,this._sceneToCubeUV(t,n,s,r),e>0&&this._blur(r,0,0,e),this._applyPMREM(r),this._cleanup(r),r}fromEquirectangular(t,e=null){return this._fromTexture(t,e)}fromCubemap(t,e=null){return this._fromTexture(t,e)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=ic(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=nc(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose()}_setSize(t){this._lodMax=Math.floor(Math.log2(t)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let t=0;t<this._lodPlanes.length;t++)this._lodPlanes[t].dispose()}_cleanup(t){this._renderer.setRenderTarget(jo,Ko,$o),this._renderer.xr.enabled=Zo,t.scissorTest=!1,yr(t,0,0,t.width,t.height)}_fromTexture(t,e){t.mapping===xs||t.mapping===vs?this._setSize(t.image.length===0?16:t.image[0].width||t.image[0].image.width):this._setSize(t.image.width/4),jo=this._renderer.getRenderTarget(),Ko=this._renderer.getActiveCubeFace(),$o=this._renderer.getActiveMipmapLevel(),Zo=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;const n=e||this._allocateTargets();return this._textureToCubeUV(t,n),this._applyPMREM(n),this._cleanup(n),n}_allocateTargets(){const t=3*Math.max(this._cubeSize,112),e=4*this._cubeSize,n={magFilter:xn,minFilter:xn,generateMipmaps:!1,type:ho,format:bn,colorSpace:hi,depthBuffer:!1},s=ec(t,e,n);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==t||this._pingPongRenderTarget.height!==e){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=ec(t,e,n);const{_lodMax:r}=this;({sizeLods:this._sizeLods,lodPlanes:this._lodPlanes,sigmas:this._sigmas}=Gm(r)),this._blurMaterial=Vm(r,t,e)}return s}_compileMaterial(t){const e=new me(this._lodPlanes[0],t);this._renderer.compile(e,Yo)}_sceneToCubeUV(t,e,n,s){const a=new sn(90,1,e,n),l=[1,-1,1,1,1,1],c=[1,1,1,-1,-1,-1],h=this._renderer,f=h.autoClear,u=h.toneMapping;h.getClearColor(Jl),h.toneMapping=ai,h.autoClear=!1;const d=new Du({name:"PMREM.Background",side:Fe,depthWrite:!1,depthTest:!1}),g=new me(new Cn,d);let _=!1;const m=t.background;m?m.isColor&&(d.color.copy(m),t.background=null,_=!0):(d.color.copy(Jl),_=!0);for(let p=0;p<6;p++){const M=p%3;M===0?(a.up.set(0,l[p],0),a.lookAt(c[p],0,0)):M===1?(a.up.set(0,0,l[p]),a.lookAt(0,c[p],0)):(a.up.set(0,l[p],0),a.lookAt(0,0,c[p]));const x=this._cubeSize;yr(s,M*x,p>2?x:0,x,x),h.setRenderTarget(s),_&&h.render(g,a),h.render(t,a)}g.geometry.dispose(),g.material.dispose(),h.toneMapping=u,h.autoClear=f,t.background=m}_textureToCubeUV(t,e){const n=this._renderer,s=t.mapping===xs||t.mapping===vs;s?(this._cubemapMaterial===null&&(this._cubemapMaterial=ic()),this._cubemapMaterial.uniforms.flipEnvMap.value=t.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=nc());const r=s?this._cubemapMaterial:this._equirectMaterial,o=new me(this._lodPlanes[0],r),a=r.uniforms;a.envMap.value=t;const l=this._cubeSize;yr(e,0,0,3*l,2*l),n.setRenderTarget(e),n.render(o,Yo)}_applyPMREM(t){const e=this._renderer,n=e.autoClear;e.autoClear=!1;const s=this._lodPlanes.length;for(let r=1;r<s;r++){const o=Math.sqrt(this._sigmas[r]*this._sigmas[r]-this._sigmas[r-1]*this._sigmas[r-1]),a=Ql[(s-r-1)%Ql.length];this._blur(t,r-1,r,o,a)}e.autoClear=n}_blur(t,e,n,s,r){const o=this._pingPongRenderTarget;this._halfBlur(t,o,e,n,s,"latitudinal",r),this._halfBlur(o,t,n,n,s,"longitudinal",r)}_halfBlur(t,e,n,s,r,o,a){const l=this._renderer,c=this._blurMaterial;o!=="latitudinal"&&o!=="longitudinal"&&console.error("blur direction must be either latitudinal or longitudinal!");const h=3,f=new me(this._lodPlanes[s],c),u=c.uniforms,d=this._sizeLods[n]-1,g=isFinite(r)?Math.PI/(2*d):2*Math.PI/(2*Ti-1),_=r/g,m=isFinite(r)?1+Math.floor(h*_):Ti;m>Ti&&console.warn(`sigmaRadians, ${r}, is too large and will clip, as it requested ${m} samples when the maximum is set to ${Ti}`);const p=[];let M=0;for(let S=0;S<Ti;++S){const P=S/_,T=Math.exp(-P*P/2);p.push(T),S===0?M+=T:S<m&&(M+=2*T)}for(let S=0;S<p.length;S++)p[S]=p[S]/M;u.envMap.value=t.texture,u.samples.value=m,u.weights.value=p,u.latitudinal.value=o==="latitudinal",a&&(u.poleAxis.value=a);const{_lodMax:x}=this;u.dTheta.value=g,u.mipInt.value=x-n;const E=this._sizeLods[s],A=3*E*(s>x-hs?s-x+hs:0),b=4*(this._cubeSize-E);yr(e,A,b,3*E,2*E),l.setRenderTarget(e),l.render(f,Yo)}}function Gm(i){const t=[],e=[],n=[];let s=i;const r=i-hs+1+Zl.length;for(let o=0;o<r;o++){const a=Math.pow(2,s);e.push(a);let l=1/a;o>i-hs?l=Zl[o-i+hs-1]:o===0&&(l=0),n.push(l);const c=1/(a-2),h=-c,f=1+c,u=[h,h,f,h,f,f,h,h,f,f,h,f],d=6,g=6,_=3,m=2,p=1,M=new Float32Array(_*g*d),x=new Float32Array(m*g*d),E=new Float32Array(p*g*d);for(let b=0;b<d;b++){const S=b%3*2/3-1,P=b>2?0:-1,T=[S,P,0,S+2/3,P,0,S+2/3,P+1,0,S,P,0,S+2/3,P+1,0,S,P+1,0];M.set(T,_*g*b),x.set(u,m*g*b);const v=[b,b,b,b,b,b];E.set(v,p*g*b)}const A=new We;A.setAttribute("position",new Je(M,_)),A.setAttribute("uv",new Je(x,m)),A.setAttribute("faceIndex",new Je(E,p)),t.push(A),s>hs&&s--}return{lodPlanes:t,sizeLods:e,sigmas:n}}function ec(i,t,e){const n=new Ri(i,t,e);return n.texture.mapping=uo,n.texture.name="PMREM.cubeUv",n.scissorTest=!0,n}function yr(i,t,e,n,s){i.viewport.set(t,e,n,s),i.scissor.set(t,e,n,s)}function Vm(i,t,e){const n=new Float32Array(Ti),s=new I(0,1,0);return new ci({name:"SphericalGaussianBlur",defines:{n:Ti,CUBEUV_TEXEL_WIDTH:1/t,CUBEUV_TEXEL_HEIGHT:1/e,CUBEUV_MAX_MIP:`${i}.0`},uniforms:{envMap:{value:null},samples:{value:1},weights:{value:n},latitudinal:{value:!1},dTheta:{value:0},mipInt:{value:0},poleAxis:{value:s}},vertexShader:Wa(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform int samples;
			uniform float weights[ n ];
			uniform bool latitudinal;
			uniform float dTheta;
			uniform float mipInt;
			uniform vec3 poleAxis;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			vec3 getSample( float theta, vec3 axis ) {

				float cosTheta = cos( theta );
				// Rodrigues' axis-angle rotation
				vec3 sampleDirection = vOutputDirection * cosTheta
					+ cross( axis, vOutputDirection ) * sin( theta )
					+ axis * dot( axis, vOutputDirection ) * ( 1.0 - cosTheta );

				return bilinearCubeUV( envMap, sampleDirection, mipInt );

			}

			void main() {

				vec3 axis = latitudinal ? poleAxis : cross( poleAxis, vOutputDirection );

				if ( all( equal( axis, vec3( 0.0 ) ) ) ) {

					axis = vec3( vOutputDirection.z, 0.0, - vOutputDirection.x );

				}

				axis = normalize( axis );

				gl_FragColor = vec4( 0.0, 0.0, 0.0, 1.0 );
				gl_FragColor.rgb += weights[ 0 ] * getSample( 0.0, axis );

				for ( int i = 1; i < n; i++ ) {

					if ( i >= samples ) {

						break;

					}

					float theta = dTheta * float( i );
					gl_FragColor.rgb += weights[ i ] * getSample( -1.0 * theta, axis );
					gl_FragColor.rgb += weights[ i ] * getSample( theta, axis );

				}

			}
		`,blending:oi,depthTest:!1,depthWrite:!1})}function nc(){return new ci({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:Wa(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;

			#include <common>

			void main() {

				vec3 outputDirection = normalize( vOutputDirection );
				vec2 uv = equirectUv( outputDirection );

				gl_FragColor = vec4( texture2D ( envMap, uv ).rgb, 1.0 );

			}
		`,blending:oi,depthTest:!1,depthWrite:!1})}function ic(){return new ci({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:Wa(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:oi,depthTest:!1,depthWrite:!1})}function Wa(){return`

		precision mediump float;
		precision mediump int;

		attribute float faceIndex;

		varying vec3 vOutputDirection;

		// RH coordinate system; PMREM face-indexing convention
		vec3 getDirection( vec2 uv, float face ) {

			uv = 2.0 * uv - 1.0;

			vec3 direction = vec3( uv, 1.0 );

			if ( face == 0.0 ) {

				direction = direction.zyx; // ( 1, v, u ) pos x

			} else if ( face == 1.0 ) {

				direction = direction.xzy;
				direction.xz *= -1.0; // ( -u, 1, -v ) pos y

			} else if ( face == 2.0 ) {

				direction.x *= -1.0; // ( -u, v, 1 ) pos z

			} else if ( face == 3.0 ) {

				direction = direction.zyx;
				direction.xz *= -1.0; // ( -1, v, -u ) neg x

			} else if ( face == 4.0 ) {

				direction = direction.xzy;
				direction.xy *= -1.0; // ( -u, -1, v ) neg y

			} else if ( face == 5.0 ) {

				direction.z *= -1.0; // ( u, v, -1 ) neg z

			}

			return direction;

		}

		void main() {

			vOutputDirection = getDirection( uv, faceIndex );
			gl_Position = vec4( position, 1.0 );

		}
	`}function Wm(i){let t=new WeakMap,e=null;function n(a){if(a&&a.isTexture){const l=a.mapping,c=l===ya||l===Ea,h=l===xs||l===vs;if(c||h){let f=t.get(a);const u=f!==void 0?f.texture.pmremVersion:0;if(a.isRenderTargetTexture&&a.pmremVersion!==u)return e===null&&(e=new tc(i)),f=c?e.fromEquirectangular(a,f):e.fromCubemap(a,f),f.texture.pmremVersion=a.pmremVersion,t.set(a,f),f.texture;if(f!==void 0)return f.texture;{const d=a.image;return c&&d&&d.height>0||h&&d&&s(d)?(e===null&&(e=new tc(i)),f=c?e.fromEquirectangular(a):e.fromCubemap(a),f.texture.pmremVersion=a.pmremVersion,t.set(a,f),a.addEventListener("dispose",r),f.texture):null}}}return a}function s(a){let l=0;const c=6;for(let h=0;h<c;h++)a[h]!==void 0&&l++;return l===c}function r(a){const l=a.target;l.removeEventListener("dispose",r);const c=t.get(l);c!==void 0&&(t.delete(l),c.dispose())}function o(){t=new WeakMap,e!==null&&(e.dispose(),e=null)}return{get:n,dispose:o}}function Xm(i){const t={};function e(n){if(t[n]!==void 0)return t[n];let s;switch(n){case"WEBGL_depth_texture":s=i.getExtension("WEBGL_depth_texture")||i.getExtension("MOZ_WEBGL_depth_texture")||i.getExtension("WEBKIT_WEBGL_depth_texture");break;case"EXT_texture_filter_anisotropic":s=i.getExtension("EXT_texture_filter_anisotropic")||i.getExtension("MOZ_EXT_texture_filter_anisotropic")||i.getExtension("WEBKIT_EXT_texture_filter_anisotropic");break;case"WEBGL_compressed_texture_s3tc":s=i.getExtension("WEBGL_compressed_texture_s3tc")||i.getExtension("MOZ_WEBGL_compressed_texture_s3tc")||i.getExtension("WEBKIT_WEBGL_compressed_texture_s3tc");break;case"WEBGL_compressed_texture_pvrtc":s=i.getExtension("WEBGL_compressed_texture_pvrtc")||i.getExtension("WEBKIT_WEBGL_compressed_texture_pvrtc");break;default:s=i.getExtension(n)}return t[n]=s,s}return{has:function(n){return e(n)!==null},init:function(){e("EXT_color_buffer_float"),e("WEBGL_clip_cull_distance"),e("OES_texture_float_linear"),e("EXT_color_buffer_half_float"),e("WEBGL_multisampled_render_to_texture"),e("WEBGL_render_shared_exponent")},get:function(n){const s=e(n);return s===null&&Ru("THREE.WebGLRenderer: "+n+" extension not supported."),s}}}function qm(i,t,e,n){const s={},r=new WeakMap;function o(f){const u=f.target;u.index!==null&&t.remove(u.index);for(const g in u.attributes)t.remove(u.attributes[g]);for(const g in u.morphAttributes){const _=u.morphAttributes[g];for(let m=0,p=_.length;m<p;m++)t.remove(_[m])}u.removeEventListener("dispose",o),delete s[u.id];const d=r.get(u);d&&(t.remove(d),r.delete(u)),n.releaseStatesOfGeometry(u),u.isInstancedBufferGeometry===!0&&delete u._maxInstanceCount,e.memory.geometries--}function a(f,u){return s[u.id]===!0||(u.addEventListener("dispose",o),s[u.id]=!0,e.memory.geometries++),u}function l(f){const u=f.attributes;for(const g in u)t.update(u[g],i.ARRAY_BUFFER);const d=f.morphAttributes;for(const g in d){const _=d[g];for(let m=0,p=_.length;m<p;m++)t.update(_[m],i.ARRAY_BUFFER)}}function c(f){const u=[],d=f.index,g=f.attributes.position;let _=0;if(d!==null){const M=d.array;_=d.version;for(let x=0,E=M.length;x<E;x+=3){const A=M[x+0],b=M[x+1],S=M[x+2];u.push(A,b,b,S,S,A)}}else if(g!==void 0){const M=g.array;_=g.version;for(let x=0,E=M.length/3-1;x<E;x+=3){const A=x+0,b=x+1,S=x+2;u.push(A,b,b,S,S,A)}}else return;const m=new(wu(u)?Iu:Uu)(u,1);m.version=_;const p=r.get(f);p&&t.remove(p),r.set(f,m)}function h(f){const u=r.get(f);if(u){const d=f.index;d!==null&&u.version<d.version&&c(f)}else c(f);return r.get(f)}return{get:a,update:l,getWireframeAttribute:h}}function Ym(i,t,e){let n;function s(u){n=u}let r,o;function a(u){r=u.type,o=u.bytesPerElement}function l(u,d){i.drawElements(n,d,r,u*o),e.update(d,n,1)}function c(u,d,g){g!==0&&(i.drawElementsInstanced(n,d,r,u*o,g),e.update(d,n,g))}function h(u,d,g){if(g===0)return;const _=t.get("WEBGL_multi_draw");if(_===null)for(let m=0;m<g;m++)this.render(u[m]/o,d[m]);else{_.multiDrawElementsWEBGL(n,d,0,r,u,0,g);let m=0;for(let p=0;p<g;p++)m+=d[p];e.update(m,n,1)}}function f(u,d,g,_){if(g===0)return;const m=t.get("WEBGL_multi_draw");if(m===null)for(let p=0;p<u.length;p++)c(u[p]/o,d[p],_[p]);else{m.multiDrawElementsInstancedWEBGL(n,d,0,r,u,0,_,0,g);let p=0;for(let M=0;M<g;M++)p+=d[M];for(let M=0;M<_.length;M++)e.update(p,n,_[M])}}this.setMode=s,this.setIndex=a,this.render=l,this.renderInstances=c,this.renderMultiDraw=h,this.renderMultiDrawInstances=f}function jm(i){const t={geometries:0,textures:0},e={frame:0,calls:0,triangles:0,points:0,lines:0};function n(r,o,a){switch(e.calls++,o){case i.TRIANGLES:e.triangles+=a*(r/3);break;case i.LINES:e.lines+=a*(r/2);break;case i.LINE_STRIP:e.lines+=a*(r-1);break;case i.LINE_LOOP:e.lines+=a*r;break;case i.POINTS:e.points+=a*r;break;default:console.error("THREE.WebGLInfo: Unknown draw mode:",o);break}}function s(){e.calls=0,e.triangles=0,e.points=0,e.lines=0}return{memory:t,render:e,programs:null,autoReset:!0,reset:s,update:n}}function Km(i,t,e){const n=new WeakMap,s=new Ee;function r(o,a,l){const c=o.morphTargetInfluences,h=a.morphAttributes.position||a.morphAttributes.normal||a.morphAttributes.color,f=h!==void 0?h.length:0;let u=n.get(a);if(u===void 0||u.count!==f){let v=function(){P.dispose(),n.delete(a),a.removeEventListener("dispose",v)};var d=v;u!==void 0&&u.texture.dispose();const g=a.morphAttributes.position!==void 0,_=a.morphAttributes.normal!==void 0,m=a.morphAttributes.color!==void 0,p=a.morphAttributes.position||[],M=a.morphAttributes.normal||[],x=a.morphAttributes.color||[];let E=0;g===!0&&(E=1),_===!0&&(E=2),m===!0&&(E=3);let A=a.attributes.position.count*E,b=1;A>t.maxTextureSize&&(b=Math.ceil(A/t.maxTextureSize),A=t.maxTextureSize);const S=new Float32Array(A*b*4*f),P=new Pu(S,A,b,f);P.type=ni,P.needsUpdate=!0;const T=E*4;for(let R=0;R<f;R++){const L=p[R],D=M[R],N=x[R],z=A*b*4*R;for(let O=0;O<L.count;O++){const Y=O*T;g===!0&&(s.fromBufferAttribute(L,O),S[z+Y+0]=s.x,S[z+Y+1]=s.y,S[z+Y+2]=s.z,S[z+Y+3]=0),_===!0&&(s.fromBufferAttribute(D,O),S[z+Y+4]=s.x,S[z+Y+5]=s.y,S[z+Y+6]=s.z,S[z+Y+7]=0),m===!0&&(s.fromBufferAttribute(N,O),S[z+Y+8]=s.x,S[z+Y+9]=s.y,S[z+Y+10]=s.z,S[z+Y+11]=N.itemSize===4?s.w:1)}}u={count:f,texture:P,size:new At(A,b)},n.set(a,u),a.addEventListener("dispose",v)}if(o.isInstancedMesh===!0&&o.morphTexture!==null)l.getUniforms().setValue(i,"morphTexture",o.morphTexture,e);else{let g=0;for(let m=0;m<c.length;m++)g+=c[m];const _=a.morphTargetsRelative?1:1-g;l.getUniforms().setValue(i,"morphTargetBaseInfluence",_),l.getUniforms().setValue(i,"morphTargetInfluences",c)}l.getUniforms().setValue(i,"morphTargetsTexture",u.texture,e),l.getUniforms().setValue(i,"morphTargetsTextureSize",u.size)}return{update:r}}function $m(i,t,e,n){let s=new WeakMap;function r(l){const c=n.render.frame,h=l.geometry,f=t.get(l,h);if(s.get(f)!==c&&(t.update(f),s.set(f,c)),l.isInstancedMesh&&(l.hasEventListener("dispose",a)===!1&&l.addEventListener("dispose",a),s.get(l)!==c&&(e.update(l.instanceMatrix,i.ARRAY_BUFFER),l.instanceColor!==null&&e.update(l.instanceColor,i.ARRAY_BUFFER),s.set(l,c))),l.isSkinnedMesh){const u=l.skeleton;s.get(u)!==c&&(u.update(),s.set(u,c))}return f}function o(){s=new WeakMap}function a(l){const c=l.target;c.removeEventListener("dispose",a),e.remove(c.instanceMatrix),c.instanceColor!==null&&e.remove(c.instanceColor)}return{update:r,dispose:o}}class ku extends Ge{constructor(t,e,n,s,r,o,a,l,c,h=gs){if(h!==gs&&h!==ys)throw new Error("DepthTexture format must be either THREE.DepthFormat or THREE.DepthStencilFormat");n===void 0&&h===gs&&(n=Ms),n===void 0&&h===ys&&(n=Ss),super(null,s,r,o,a,l,h,n,c),this.isDepthTexture=!0,this.image={width:t,height:e},this.magFilter=a!==void 0?a:rn,this.minFilter=l!==void 0?l:rn,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(t){return super.copy(t),this.compareFunction=t.compareFunction,this}toJSON(t){const e=super.toJSON(t);return this.compareFunction!==null&&(e.compareFunction=this.compareFunction),e}}const Hu=new Ge,Gu=new ku(1,1);Gu.compareFunction=Au;const Vu=new Pu,Wu=new Ff,Xu=new Ou,sc=[],rc=[],oc=new Float32Array(16),ac=new Float32Array(9),lc=new Float32Array(4);function bs(i,t,e){const n=i[0];if(n<=0||n>0)return i;const s=t*e;let r=sc[s];if(r===void 0&&(r=new Float32Array(s),sc[s]=r),t!==0){n.toArray(r,0);for(let o=1,a=0;o!==t;++o)a+=e,i[o].toArray(r,a)}return r}function ve(i,t){if(i.length!==t.length)return!1;for(let e=0,n=i.length;e<n;e++)if(i[e]!==t[e])return!1;return!0}function Me(i,t){for(let e=0,n=t.length;e<n;e++)i[e]=t[e]}function po(i,t){let e=rc[t];e===void 0&&(e=new Int32Array(t),rc[t]=e);for(let n=0;n!==t;++n)e[n]=i.allocateTextureUnit();return e}function Zm(i,t){const e=this.cache;e[0]!==t&&(i.uniform1f(this.addr,t),e[0]=t)}function Jm(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(i.uniform2f(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(ve(e,t))return;i.uniform2fv(this.addr,t),Me(e,t)}}function Qm(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(i.uniform3f(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else if(t.r!==void 0)(e[0]!==t.r||e[1]!==t.g||e[2]!==t.b)&&(i.uniform3f(this.addr,t.r,t.g,t.b),e[0]=t.r,e[1]=t.g,e[2]=t.b);else{if(ve(e,t))return;i.uniform3fv(this.addr,t),Me(e,t)}}function tg(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(i.uniform4f(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(ve(e,t))return;i.uniform4fv(this.addr,t),Me(e,t)}}function eg(i,t){const e=this.cache,n=t.elements;if(n===void 0){if(ve(e,t))return;i.uniformMatrix2fv(this.addr,!1,t),Me(e,t)}else{if(ve(e,n))return;lc.set(n),i.uniformMatrix2fv(this.addr,!1,lc),Me(e,n)}}function ng(i,t){const e=this.cache,n=t.elements;if(n===void 0){if(ve(e,t))return;i.uniformMatrix3fv(this.addr,!1,t),Me(e,t)}else{if(ve(e,n))return;ac.set(n),i.uniformMatrix3fv(this.addr,!1,ac),Me(e,n)}}function ig(i,t){const e=this.cache,n=t.elements;if(n===void 0){if(ve(e,t))return;i.uniformMatrix4fv(this.addr,!1,t),Me(e,t)}else{if(ve(e,n))return;oc.set(n),i.uniformMatrix4fv(this.addr,!1,oc),Me(e,n)}}function sg(i,t){const e=this.cache;e[0]!==t&&(i.uniform1i(this.addr,t),e[0]=t)}function rg(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(i.uniform2i(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(ve(e,t))return;i.uniform2iv(this.addr,t),Me(e,t)}}function og(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(i.uniform3i(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else{if(ve(e,t))return;i.uniform3iv(this.addr,t),Me(e,t)}}function ag(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(i.uniform4i(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(ve(e,t))return;i.uniform4iv(this.addr,t),Me(e,t)}}function lg(i,t){const e=this.cache;e[0]!==t&&(i.uniform1ui(this.addr,t),e[0]=t)}function cg(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(i.uniform2ui(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(ve(e,t))return;i.uniform2uiv(this.addr,t),Me(e,t)}}function ug(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(i.uniform3ui(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else{if(ve(e,t))return;i.uniform3uiv(this.addr,t),Me(e,t)}}function hg(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(i.uniform4ui(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(ve(e,t))return;i.uniform4uiv(this.addr,t),Me(e,t)}}function fg(i,t,e){const n=this.cache,s=e.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s);const r=this.type===i.SAMPLER_2D_SHADOW?Gu:Hu;e.setTexture2D(t||r,s)}function dg(i,t,e){const n=this.cache,s=e.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),e.setTexture3D(t||Wu,s)}function pg(i,t,e){const n=this.cache,s=e.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),e.setTextureCube(t||Xu,s)}function mg(i,t,e){const n=this.cache,s=e.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),e.setTexture2DArray(t||Vu,s)}function gg(i){switch(i){case 5126:return Zm;case 35664:return Jm;case 35665:return Qm;case 35666:return tg;case 35674:return eg;case 35675:return ng;case 35676:return ig;case 5124:case 35670:return sg;case 35667:case 35671:return rg;case 35668:case 35672:return og;case 35669:case 35673:return ag;case 5125:return lg;case 36294:return cg;case 36295:return ug;case 36296:return hg;case 35678:case 36198:case 36298:case 36306:case 35682:return fg;case 35679:case 36299:case 36307:return dg;case 35680:case 36300:case 36308:case 36293:return pg;case 36289:case 36303:case 36311:case 36292:return mg}}function _g(i,t){i.uniform1fv(this.addr,t)}function xg(i,t){const e=bs(t,this.size,2);i.uniform2fv(this.addr,e)}function vg(i,t){const e=bs(t,this.size,3);i.uniform3fv(this.addr,e)}function Mg(i,t){const e=bs(t,this.size,4);i.uniform4fv(this.addr,e)}function Sg(i,t){const e=bs(t,this.size,4);i.uniformMatrix2fv(this.addr,!1,e)}function yg(i,t){const e=bs(t,this.size,9);i.uniformMatrix3fv(this.addr,!1,e)}function Eg(i,t){const e=bs(t,this.size,16);i.uniformMatrix4fv(this.addr,!1,e)}function Tg(i,t){i.uniform1iv(this.addr,t)}function bg(i,t){i.uniform2iv(this.addr,t)}function Ag(i,t){i.uniform3iv(this.addr,t)}function wg(i,t){i.uniform4iv(this.addr,t)}function Rg(i,t){i.uniform1uiv(this.addr,t)}function Cg(i,t){i.uniform2uiv(this.addr,t)}function Pg(i,t){i.uniform3uiv(this.addr,t)}function Lg(i,t){i.uniform4uiv(this.addr,t)}function Dg(i,t,e){const n=this.cache,s=t.length,r=po(e,s);ve(n,r)||(i.uniform1iv(this.addr,r),Me(n,r));for(let o=0;o!==s;++o)e.setTexture2D(t[o]||Hu,r[o])}function Ug(i,t,e){const n=this.cache,s=t.length,r=po(e,s);ve(n,r)||(i.uniform1iv(this.addr,r),Me(n,r));for(let o=0;o!==s;++o)e.setTexture3D(t[o]||Wu,r[o])}function Ig(i,t,e){const n=this.cache,s=t.length,r=po(e,s);ve(n,r)||(i.uniform1iv(this.addr,r),Me(n,r));for(let o=0;o!==s;++o)e.setTextureCube(t[o]||Xu,r[o])}function Ng(i,t,e){const n=this.cache,s=t.length,r=po(e,s);ve(n,r)||(i.uniform1iv(this.addr,r),Me(n,r));for(let o=0;o!==s;++o)e.setTexture2DArray(t[o]||Vu,r[o])}function Fg(i){switch(i){case 5126:return _g;case 35664:return xg;case 35665:return vg;case 35666:return Mg;case 35674:return Sg;case 35675:return yg;case 35676:return Eg;case 5124:case 35670:return Tg;case 35667:case 35671:return bg;case 35668:case 35672:return Ag;case 35669:case 35673:return wg;case 5125:return Rg;case 36294:return Cg;case 36295:return Pg;case 36296:return Lg;case 35678:case 36198:case 36298:case 36306:case 35682:return Dg;case 35679:case 36299:case 36307:return Ug;case 35680:case 36300:case 36308:case 36293:return Ig;case 36289:case 36303:case 36311:case 36292:return Ng}}class Og{constructor(t,e,n){this.id=t,this.addr=n,this.cache=[],this.type=e.type,this.setValue=gg(e.type)}}class zg{constructor(t,e,n){this.id=t,this.addr=n,this.cache=[],this.type=e.type,this.size=e.size,this.setValue=Fg(e.type)}}class Bg{constructor(t){this.id=t,this.seq=[],this.map={}}setValue(t,e,n){const s=this.seq;for(let r=0,o=s.length;r!==o;++r){const a=s[r];a.setValue(t,e[a.id],n)}}}const Jo=/(\w+)(\])?(\[|\.)?/g;function cc(i,t){i.seq.push(t),i.map[t.id]=t}function kg(i,t,e){const n=i.name,s=n.length;for(Jo.lastIndex=0;;){const r=Jo.exec(n),o=Jo.lastIndex;let a=r[1];const l=r[2]==="]",c=r[3];if(l&&(a=a|0),c===void 0||c==="["&&o+2===s){cc(e,c===void 0?new Og(a,i,t):new zg(a,i,t));break}else{let f=e.map[a];f===void 0&&(f=new Bg(a),cc(e,f)),e=f}}}class Wr{constructor(t,e){this.seq=[],this.map={};const n=t.getProgramParameter(e,t.ACTIVE_UNIFORMS);for(let s=0;s<n;++s){const r=t.getActiveUniform(e,s),o=t.getUniformLocation(e,r.name);kg(r,o,this)}}setValue(t,e,n,s){const r=this.map[e];r!==void 0&&r.setValue(t,n,s)}setOptional(t,e,n){const s=e[n];s!==void 0&&this.setValue(t,n,s)}static upload(t,e,n,s){for(let r=0,o=e.length;r!==o;++r){const a=e[r],l=n[a.id];l.needsUpdate!==!1&&a.setValue(t,l.value,s)}}static seqWithValue(t,e){const n=[];for(let s=0,r=t.length;s!==r;++s){const o=t[s];o.id in e&&n.push(o)}return n}}function uc(i,t,e){const n=i.createShader(t);return i.shaderSource(n,e),i.compileShader(n),n}const Hg=37297;let Gg=0;function Vg(i,t){const e=i.split(`
`),n=[],s=Math.max(t-6,0),r=Math.min(t+6,e.length);for(let o=s;o<r;o++){const a=o+1;n.push(`${a===t?">":" "} ${a}: ${e[o]}`)}return n.join(`
`)}function Wg(i){const t=ne.getPrimaries(ne.workingColorSpace),e=ne.getPrimaries(i);let n;switch(t===e?n="":t===no&&e===eo?n="LinearDisplayP3ToLinearSRGB":t===eo&&e===no&&(n="LinearSRGBToLinearDisplayP3"),i){case hi:case fo:return[n,"LinearTransferOETF"];case Sn:case Ha:return[n,"sRGBTransferOETF"];default:return console.warn("THREE.WebGLProgram: Unsupported color space:",i),[n,"LinearTransferOETF"]}}function hc(i,t,e){const n=i.getShaderParameter(t,i.COMPILE_STATUS),s=i.getShaderInfoLog(t).trim();if(n&&s==="")return"";const r=/ERROR: 0:(\d+)/.exec(s);if(r){const o=parseInt(r[1]);return e.toUpperCase()+`

`+s+`

`+Vg(i.getShaderSource(t),o)}else return s}function Xg(i,t){const e=Wg(t);return`vec4 ${i}( vec4 value ) { return ${e[0]}( ${e[1]}( value ) ); }`}function qg(i,t){let e;switch(t){case Jh:e="Linear";break;case Qh:e="Reinhard";break;case tf:e="OptimizedCineon";break;case ef:e="ACESFilmic";break;case sf:e="AgX";break;case rf:e="Neutral";break;case nf:e="Custom";break;default:console.warn("THREE.WebGLProgram: Unsupported toneMapping:",t),e="Linear"}return"vec3 "+i+"( vec3 color ) { return "+e+"ToneMapping( color ); }"}function Yg(i){return[i.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",i.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(Bs).join(`
`)}function jg(i){const t=[];for(const e in i){const n=i[e];n!==!1&&t.push("#define "+e+" "+n)}return t.join(`
`)}function Kg(i,t){const e={},n=i.getProgramParameter(t,i.ACTIVE_ATTRIBUTES);for(let s=0;s<n;s++){const r=i.getActiveAttrib(t,s),o=r.name;let a=1;r.type===i.FLOAT_MAT2&&(a=2),r.type===i.FLOAT_MAT3&&(a=3),r.type===i.FLOAT_MAT4&&(a=4),e[o]={type:r.type,location:i.getAttribLocation(t,o),locationSize:a}}return e}function Bs(i){return i!==""}function fc(i,t){const e=t.numSpotLightShadows+t.numSpotLightMaps-t.numSpotLightShadowsWithMaps;return i.replace(/NUM_DIR_LIGHTS/g,t.numDirLights).replace(/NUM_SPOT_LIGHTS/g,t.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,t.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,e).replace(/NUM_RECT_AREA_LIGHTS/g,t.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,t.numPointLights).replace(/NUM_HEMI_LIGHTS/g,t.numHemiLights).replace(/NUM_DIR_LIGHT_SHADOWS/g,t.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,t.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,t.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,t.numPointLightShadows)}function dc(i,t){return i.replace(/NUM_CLIPPING_PLANES/g,t.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,t.numClippingPlanes-t.numClipIntersection)}const $g=/^[ \t]*#include +<([\w\d./]+)>/gm;function wa(i){return i.replace($g,Jg)}const Zg=new Map;function Jg(i,t){let e=Gt[t];if(e===void 0){const n=Zg.get(t);if(n!==void 0)e=Gt[n],console.warn('THREE.WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',t,n);else throw new Error("Can not resolve #include <"+t+">")}return wa(e)}const Qg=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function pc(i){return i.replace(Qg,t_)}function t_(i,t,e,n){let s="";for(let r=parseInt(t);r<parseInt(e);r++)s+=n.replace(/\[\s*i\s*\]/g,"[ "+r+" ]").replace(/UNROLLED_LOOP_INDEX/g,r);return s}function mc(i){let t=`precision ${i.precision} float;
	precision ${i.precision} int;
	precision ${i.precision} sampler2D;
	precision ${i.precision} samplerCube;
	precision ${i.precision} sampler3D;
	precision ${i.precision} sampler2DArray;
	precision ${i.precision} sampler2DShadow;
	precision ${i.precision} samplerCubeShadow;
	precision ${i.precision} sampler2DArrayShadow;
	precision ${i.precision} isampler2D;
	precision ${i.precision} isampler3D;
	precision ${i.precision} isamplerCube;
	precision ${i.precision} isampler2DArray;
	precision ${i.precision} usampler2D;
	precision ${i.precision} usampler3D;
	precision ${i.precision} usamplerCube;
	precision ${i.precision} usampler2DArray;
	`;return i.precision==="highp"?t+=`
#define HIGH_PRECISION`:i.precision==="mediump"?t+=`
#define MEDIUM_PRECISION`:i.precision==="lowp"&&(t+=`
#define LOW_PRECISION`),t}function e_(i){let t="SHADOWMAP_TYPE_BASIC";return i.shadowMapType===_u?t="SHADOWMAP_TYPE_PCF":i.shadowMapType===Th?t="SHADOWMAP_TYPE_PCF_SOFT":i.shadowMapType===On&&(t="SHADOWMAP_TYPE_VSM"),t}function n_(i){let t="ENVMAP_TYPE_CUBE";if(i.envMap)switch(i.envMapMode){case xs:case vs:t="ENVMAP_TYPE_CUBE";break;case uo:t="ENVMAP_TYPE_CUBE_UV";break}return t}function i_(i){let t="ENVMAP_MODE_REFLECTION";if(i.envMap)switch(i.envMapMode){case vs:t="ENVMAP_MODE_REFRACTION";break}return t}function s_(i){let t="ENVMAP_BLENDING_NONE";if(i.envMap)switch(i.combine){case ka:t="ENVMAP_BLENDING_MULTIPLY";break;case $h:t="ENVMAP_BLENDING_MIX";break;case Zh:t="ENVMAP_BLENDING_ADD";break}return t}function r_(i){const t=i.envMapCubeUVHeight;if(t===null)return null;const e=Math.log2(t)-2,n=1/t;return{texelWidth:1/(3*Math.max(Math.pow(2,e),7*16)),texelHeight:n,maxMip:e}}function o_(i,t,e,n){const s=i.getContext(),r=e.defines;let o=e.vertexShader,a=e.fragmentShader;const l=e_(e),c=n_(e),h=i_(e),f=s_(e),u=r_(e),d=Yg(e),g=jg(r),_=s.createProgram();let m,p,M=e.glslVersion?"#version "+e.glslVersion+`
`:"";e.isRawShaderMaterial?(m=["#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,g].filter(Bs).join(`
`),m.length>0&&(m+=`
`),p=["#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,g].filter(Bs).join(`
`),p.length>0&&(p+=`
`)):(m=[mc(e),"#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,g,e.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",e.batching?"#define USE_BATCHING":"",e.batchingColor?"#define USE_BATCHING_COLOR":"",e.instancing?"#define USE_INSTANCING":"",e.instancingColor?"#define USE_INSTANCING_COLOR":"",e.instancingMorph?"#define USE_INSTANCING_MORPH":"",e.useFog&&e.fog?"#define USE_FOG":"",e.useFog&&e.fogExp2?"#define FOG_EXP2":"",e.map?"#define USE_MAP":"",e.envMap?"#define USE_ENVMAP":"",e.envMap?"#define "+h:"",e.lightMap?"#define USE_LIGHTMAP":"",e.aoMap?"#define USE_AOMAP":"",e.bumpMap?"#define USE_BUMPMAP":"",e.normalMap?"#define USE_NORMALMAP":"",e.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",e.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",e.displacementMap?"#define USE_DISPLACEMENTMAP":"",e.emissiveMap?"#define USE_EMISSIVEMAP":"",e.anisotropy?"#define USE_ANISOTROPY":"",e.anisotropyMap?"#define USE_ANISOTROPYMAP":"",e.clearcoatMap?"#define USE_CLEARCOATMAP":"",e.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",e.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",e.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",e.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",e.specularMap?"#define USE_SPECULARMAP":"",e.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",e.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",e.roughnessMap?"#define USE_ROUGHNESSMAP":"",e.metalnessMap?"#define USE_METALNESSMAP":"",e.alphaMap?"#define USE_ALPHAMAP":"",e.alphaHash?"#define USE_ALPHAHASH":"",e.transmission?"#define USE_TRANSMISSION":"",e.transmissionMap?"#define USE_TRANSMISSIONMAP":"",e.thicknessMap?"#define USE_THICKNESSMAP":"",e.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",e.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",e.mapUv?"#define MAP_UV "+e.mapUv:"",e.alphaMapUv?"#define ALPHAMAP_UV "+e.alphaMapUv:"",e.lightMapUv?"#define LIGHTMAP_UV "+e.lightMapUv:"",e.aoMapUv?"#define AOMAP_UV "+e.aoMapUv:"",e.emissiveMapUv?"#define EMISSIVEMAP_UV "+e.emissiveMapUv:"",e.bumpMapUv?"#define BUMPMAP_UV "+e.bumpMapUv:"",e.normalMapUv?"#define NORMALMAP_UV "+e.normalMapUv:"",e.displacementMapUv?"#define DISPLACEMENTMAP_UV "+e.displacementMapUv:"",e.metalnessMapUv?"#define METALNESSMAP_UV "+e.metalnessMapUv:"",e.roughnessMapUv?"#define ROUGHNESSMAP_UV "+e.roughnessMapUv:"",e.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+e.anisotropyMapUv:"",e.clearcoatMapUv?"#define CLEARCOATMAP_UV "+e.clearcoatMapUv:"",e.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+e.clearcoatNormalMapUv:"",e.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+e.clearcoatRoughnessMapUv:"",e.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+e.iridescenceMapUv:"",e.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+e.iridescenceThicknessMapUv:"",e.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+e.sheenColorMapUv:"",e.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+e.sheenRoughnessMapUv:"",e.specularMapUv?"#define SPECULARMAP_UV "+e.specularMapUv:"",e.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+e.specularColorMapUv:"",e.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+e.specularIntensityMapUv:"",e.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+e.transmissionMapUv:"",e.thicknessMapUv?"#define THICKNESSMAP_UV "+e.thicknessMapUv:"",e.vertexTangents&&e.flatShading===!1?"#define USE_TANGENT":"",e.vertexColors?"#define USE_COLOR":"",e.vertexAlphas?"#define USE_COLOR_ALPHA":"",e.vertexUv1s?"#define USE_UV1":"",e.vertexUv2s?"#define USE_UV2":"",e.vertexUv3s?"#define USE_UV3":"",e.pointsUvs?"#define USE_POINTS_UV":"",e.flatShading?"#define FLAT_SHADED":"",e.skinning?"#define USE_SKINNING":"",e.morphTargets?"#define USE_MORPHTARGETS":"",e.morphNormals&&e.flatShading===!1?"#define USE_MORPHNORMALS":"",e.morphColors?"#define USE_MORPHCOLORS":"",e.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+e.morphTextureStride:"",e.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+e.morphTargetsCount:"",e.doubleSided?"#define DOUBLE_SIDED":"",e.flipSided?"#define FLIP_SIDED":"",e.shadowMapEnabled?"#define USE_SHADOWMAP":"",e.shadowMapEnabled?"#define "+l:"",e.sizeAttenuation?"#define USE_SIZEATTENUATION":"",e.numLightProbes>0?"#define USE_LIGHT_PROBES":"",e.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(Bs).join(`
`),p=[mc(e),"#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,g,e.useFog&&e.fog?"#define USE_FOG":"",e.useFog&&e.fogExp2?"#define FOG_EXP2":"",e.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",e.map?"#define USE_MAP":"",e.matcap?"#define USE_MATCAP":"",e.envMap?"#define USE_ENVMAP":"",e.envMap?"#define "+c:"",e.envMap?"#define "+h:"",e.envMap?"#define "+f:"",u?"#define CUBEUV_TEXEL_WIDTH "+u.texelWidth:"",u?"#define CUBEUV_TEXEL_HEIGHT "+u.texelHeight:"",u?"#define CUBEUV_MAX_MIP "+u.maxMip+".0":"",e.lightMap?"#define USE_LIGHTMAP":"",e.aoMap?"#define USE_AOMAP":"",e.bumpMap?"#define USE_BUMPMAP":"",e.normalMap?"#define USE_NORMALMAP":"",e.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",e.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",e.emissiveMap?"#define USE_EMISSIVEMAP":"",e.anisotropy?"#define USE_ANISOTROPY":"",e.anisotropyMap?"#define USE_ANISOTROPYMAP":"",e.clearcoat?"#define USE_CLEARCOAT":"",e.clearcoatMap?"#define USE_CLEARCOATMAP":"",e.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",e.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",e.dispersion?"#define USE_DISPERSION":"",e.iridescence?"#define USE_IRIDESCENCE":"",e.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",e.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",e.specularMap?"#define USE_SPECULARMAP":"",e.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",e.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",e.roughnessMap?"#define USE_ROUGHNESSMAP":"",e.metalnessMap?"#define USE_METALNESSMAP":"",e.alphaMap?"#define USE_ALPHAMAP":"",e.alphaTest?"#define USE_ALPHATEST":"",e.alphaHash?"#define USE_ALPHAHASH":"",e.sheen?"#define USE_SHEEN":"",e.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",e.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",e.transmission?"#define USE_TRANSMISSION":"",e.transmissionMap?"#define USE_TRANSMISSIONMAP":"",e.thicknessMap?"#define USE_THICKNESSMAP":"",e.vertexTangents&&e.flatShading===!1?"#define USE_TANGENT":"",e.vertexColors||e.instancingColor||e.batchingColor?"#define USE_COLOR":"",e.vertexAlphas?"#define USE_COLOR_ALPHA":"",e.vertexUv1s?"#define USE_UV1":"",e.vertexUv2s?"#define USE_UV2":"",e.vertexUv3s?"#define USE_UV3":"",e.pointsUvs?"#define USE_POINTS_UV":"",e.gradientMap?"#define USE_GRADIENTMAP":"",e.flatShading?"#define FLAT_SHADED":"",e.doubleSided?"#define DOUBLE_SIDED":"",e.flipSided?"#define FLIP_SIDED":"",e.shadowMapEnabled?"#define USE_SHADOWMAP":"",e.shadowMapEnabled?"#define "+l:"",e.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",e.numLightProbes>0?"#define USE_LIGHT_PROBES":"",e.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",e.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",e.toneMapping!==ai?"#define TONE_MAPPING":"",e.toneMapping!==ai?Gt.tonemapping_pars_fragment:"",e.toneMapping!==ai?qg("toneMapping",e.toneMapping):"",e.dithering?"#define DITHERING":"",e.opaque?"#define OPAQUE":"",Gt.colorspace_pars_fragment,Xg("linearToOutputTexel",e.outputColorSpace),e.useDepthPacking?"#define DEPTH_PACKING "+e.depthPacking:"",`
`].filter(Bs).join(`
`)),o=wa(o),o=fc(o,e),o=dc(o,e),a=wa(a),a=fc(a,e),a=dc(a,e),o=pc(o),a=pc(a),e.isRawShaderMaterial!==!0&&(M=`#version 300 es
`,m=[d,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+m,p=["#define varying in",e.glslVersion===Ll?"":"layout(location = 0) out highp vec4 pc_fragColor;",e.glslVersion===Ll?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+p);const x=M+m+o,E=M+p+a,A=uc(s,s.VERTEX_SHADER,x),b=uc(s,s.FRAGMENT_SHADER,E);s.attachShader(_,A),s.attachShader(_,b),e.index0AttributeName!==void 0?s.bindAttribLocation(_,0,e.index0AttributeName):e.morphTargets===!0&&s.bindAttribLocation(_,0,"position"),s.linkProgram(_);function S(R){if(i.debug.checkShaderErrors){const L=s.getProgramInfoLog(_).trim(),D=s.getShaderInfoLog(A).trim(),N=s.getShaderInfoLog(b).trim();let z=!0,O=!0;if(s.getProgramParameter(_,s.LINK_STATUS)===!1)if(z=!1,typeof i.debug.onShaderError=="function")i.debug.onShaderError(s,_,A,b);else{const Y=hc(s,A,"vertex"),B=hc(s,b,"fragment");console.error("THREE.WebGLProgram: Shader Error "+s.getError()+" - VALIDATE_STATUS "+s.getProgramParameter(_,s.VALIDATE_STATUS)+`

Material Name: `+R.name+`
Material Type: `+R.type+`

Program Info Log: `+L+`
`+Y+`
`+B)}else L!==""?console.warn("THREE.WebGLProgram: Program Info Log:",L):(D===""||N==="")&&(O=!1);O&&(R.diagnostics={runnable:z,programLog:L,vertexShader:{log:D,prefix:m},fragmentShader:{log:N,prefix:p}})}s.deleteShader(A),s.deleteShader(b),P=new Wr(s,_),T=Kg(s,_)}let P;this.getUniforms=function(){return P===void 0&&S(this),P};let T;this.getAttributes=function(){return T===void 0&&S(this),T};let v=e.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return v===!1&&(v=s.getProgramParameter(_,Hg)),v},this.destroy=function(){n.releaseStatesOfProgram(this),s.deleteProgram(_),this.program=void 0},this.type=e.shaderType,this.name=e.shaderName,this.id=Gg++,this.cacheKey=t,this.usedTimes=1,this.program=_,this.vertexShader=A,this.fragmentShader=b,this}let a_=0;class l_{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(t){const e=t.vertexShader,n=t.fragmentShader,s=this._getShaderStage(e),r=this._getShaderStage(n),o=this._getShaderCacheForMaterial(t);return o.has(s)===!1&&(o.add(s),s.usedTimes++),o.has(r)===!1&&(o.add(r),r.usedTimes++),this}remove(t){const e=this.materialCache.get(t);for(const n of e)n.usedTimes--,n.usedTimes===0&&this.shaderCache.delete(n.code);return this.materialCache.delete(t),this}getVertexShaderID(t){return this._getShaderStage(t.vertexShader).id}getFragmentShaderID(t){return this._getShaderStage(t.fragmentShader).id}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(t){const e=this.materialCache;let n=e.get(t);return n===void 0&&(n=new Set,e.set(t,n)),n}_getShaderStage(t){const e=this.shaderCache;let n=e.get(t);return n===void 0&&(n=new c_(t),e.set(t,n)),n}}class c_{constructor(t){this.id=a_++,this.code=t,this.usedTimes=0}}function u_(i,t,e,n,s,r,o){const a=new Ga,l=new l_,c=new Set,h=[],f=s.logarithmicDepthBuffer,u=s.vertexTextures;let d=s.precision;const g={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distanceRGBA",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function _(T){return c.add(T),T===0?"uv":`uv${T}`}function m(T,v,R,L,D){const N=L.fog,z=D.geometry,O=T.isMeshStandardMaterial?L.environment:null,Y=(T.isMeshStandardMaterial?e:t).get(T.envMap||O),B=Y&&Y.mapping===uo?Y.image.height:null,it=g[T.type];T.precision!==null&&(d=s.getMaxPrecision(T.precision),d!==T.precision&&console.warn("THREE.WebGLProgram.getParameters:",T.precision,"not supported, using",d,"instead."));const st=z.morphAttributes.position||z.morphAttributes.normal||z.morphAttributes.color,ht=st!==void 0?st.length:0;let Pt=0;z.morphAttributes.position!==void 0&&(Pt=1),z.morphAttributes.normal!==void 0&&(Pt=2),z.morphAttributes.color!==void 0&&(Pt=3);let Wt,K,et,pt;if(it){const Yt=yn[it];Wt=Yt.vertexShader,K=Yt.fragmentShader}else Wt=T.vertexShader,K=T.fragmentShader,l.update(T),et=l.getVertexShaderID(T),pt=l.getFragmentShaderID(T);const lt=i.getRenderTarget(),Ot=D.isInstancedMesh===!0,Rt=D.isBatchedMesh===!0,Xt=!!T.map,F=!!T.matcap,qt=!!Y,zt=!!T.aoMap,Qt=!!T.lightMap,_t=!!T.bumpMap,Ht=!!T.normalMap,Bt=!!T.displacementMap,wt=!!T.emissiveMap,$t=!!T.metalnessMap,U=!!T.roughnessMap,w=T.anisotropy>0,X=T.clearcoat>0,Z=T.dispersion>0,tt=T.iridescence>0,J=T.sheen>0,vt=T.transmission>0,ot=w&&!!T.anisotropyMap,at=X&&!!T.clearcoatMap,Ut=X&&!!T.clearcoatNormalMap,nt=X&&!!T.clearcoatRoughnessMap,mt=tt&&!!T.iridescenceMap,kt=tt&&!!T.iridescenceThicknessMap,Et=J&&!!T.sheenColorMap,ct=J&&!!T.sheenRoughnessMap,It=!!T.specularMap,Tt=!!T.specularColorMap,re=!!T.specularIntensityMap,y=vt&&!!T.transmissionMap,q=vt&&!!T.thicknessMap,G=!!T.gradientMap,j=!!T.alphaMap,Q=T.alphaTest>0,Mt=!!T.alphaHash,St=!!T.extensions;let te=ai;T.toneMapped&&(lt===null||lt.isXRRenderTarget===!0)&&(te=i.toneMapping);const ce={shaderID:it,shaderType:T.type,shaderName:T.name,vertexShader:Wt,fragmentShader:K,defines:T.defines,customVertexShaderID:et,customFragmentShaderID:pt,isRawShaderMaterial:T.isRawShaderMaterial===!0,glslVersion:T.glslVersion,precision:d,batching:Rt,batchingColor:Rt&&D._colorsTexture!==null,instancing:Ot,instancingColor:Ot&&D.instanceColor!==null,instancingMorph:Ot&&D.morphTexture!==null,supportsVertexTextures:u,outputColorSpace:lt===null?i.outputColorSpace:lt.isXRRenderTarget===!0?lt.texture.colorSpace:hi,alphaToCoverage:!!T.alphaToCoverage,map:Xt,matcap:F,envMap:qt,envMapMode:qt&&Y.mapping,envMapCubeUVHeight:B,aoMap:zt,lightMap:Qt,bumpMap:_t,normalMap:Ht,displacementMap:u&&Bt,emissiveMap:wt,normalMapObjectSpace:Ht&&T.normalMapType===vf,normalMapTangentSpace:Ht&&T.normalMapType===bu,metalnessMap:$t,roughnessMap:U,anisotropy:w,anisotropyMap:ot,clearcoat:X,clearcoatMap:at,clearcoatNormalMap:Ut,clearcoatRoughnessMap:nt,dispersion:Z,iridescence:tt,iridescenceMap:mt,iridescenceThicknessMap:kt,sheen:J,sheenColorMap:Et,sheenRoughnessMap:ct,specularMap:It,specularColorMap:Tt,specularIntensityMap:re,transmission:vt,transmissionMap:y,thicknessMap:q,gradientMap:G,opaque:T.transparent===!1&&T.blending===ms&&T.alphaToCoverage===!1,alphaMap:j,alphaTest:Q,alphaHash:Mt,combine:T.combine,mapUv:Xt&&_(T.map.channel),aoMapUv:zt&&_(T.aoMap.channel),lightMapUv:Qt&&_(T.lightMap.channel),bumpMapUv:_t&&_(T.bumpMap.channel),normalMapUv:Ht&&_(T.normalMap.channel),displacementMapUv:Bt&&_(T.displacementMap.channel),emissiveMapUv:wt&&_(T.emissiveMap.channel),metalnessMapUv:$t&&_(T.metalnessMap.channel),roughnessMapUv:U&&_(T.roughnessMap.channel),anisotropyMapUv:ot&&_(T.anisotropyMap.channel),clearcoatMapUv:at&&_(T.clearcoatMap.channel),clearcoatNormalMapUv:Ut&&_(T.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:nt&&_(T.clearcoatRoughnessMap.channel),iridescenceMapUv:mt&&_(T.iridescenceMap.channel),iridescenceThicknessMapUv:kt&&_(T.iridescenceThicknessMap.channel),sheenColorMapUv:Et&&_(T.sheenColorMap.channel),sheenRoughnessMapUv:ct&&_(T.sheenRoughnessMap.channel),specularMapUv:It&&_(T.specularMap.channel),specularColorMapUv:Tt&&_(T.specularColorMap.channel),specularIntensityMapUv:re&&_(T.specularIntensityMap.channel),transmissionMapUv:y&&_(T.transmissionMap.channel),thicknessMapUv:q&&_(T.thicknessMap.channel),alphaMapUv:j&&_(T.alphaMap.channel),vertexTangents:!!z.attributes.tangent&&(Ht||w),vertexColors:T.vertexColors,vertexAlphas:T.vertexColors===!0&&!!z.attributes.color&&z.attributes.color.itemSize===4,pointsUvs:D.isPoints===!0&&!!z.attributes.uv&&(Xt||j),fog:!!N,useFog:T.fog===!0,fogExp2:!!N&&N.isFogExp2,flatShading:T.flatShading===!0,sizeAttenuation:T.sizeAttenuation===!0,logarithmicDepthBuffer:f,skinning:D.isSkinnedMesh===!0,morphTargets:z.morphAttributes.position!==void 0,morphNormals:z.morphAttributes.normal!==void 0,morphColors:z.morphAttributes.color!==void 0,morphTargetsCount:ht,morphTextureStride:Pt,numDirLights:v.directional.length,numPointLights:v.point.length,numSpotLights:v.spot.length,numSpotLightMaps:v.spotLightMap.length,numRectAreaLights:v.rectArea.length,numHemiLights:v.hemi.length,numDirLightShadows:v.directionalShadowMap.length,numPointLightShadows:v.pointShadowMap.length,numSpotLightShadows:v.spotShadowMap.length,numSpotLightShadowsWithMaps:v.numSpotLightShadowsWithMaps,numLightProbes:v.numLightProbes,numClippingPlanes:o.numPlanes,numClipIntersection:o.numIntersection,dithering:T.dithering,shadowMapEnabled:i.shadowMap.enabled&&R.length>0,shadowMapType:i.shadowMap.type,toneMapping:te,decodeVideoTexture:Xt&&T.map.isVideoTexture===!0&&ne.getTransfer(T.map.colorSpace)===oe,premultipliedAlpha:T.premultipliedAlpha,doubleSided:T.side===En,flipSided:T.side===Fe,useDepthPacking:T.depthPacking>=0,depthPacking:T.depthPacking||0,index0AttributeName:T.index0AttributeName,extensionClipCullDistance:St&&T.extensions.clipCullDistance===!0&&n.has("WEBGL_clip_cull_distance"),extensionMultiDraw:St&&T.extensions.multiDraw===!0&&n.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:n.has("KHR_parallel_shader_compile"),customProgramCacheKey:T.customProgramCacheKey()};return ce.vertexUv1s=c.has(1),ce.vertexUv2s=c.has(2),ce.vertexUv3s=c.has(3),c.clear(),ce}function p(T){const v=[];if(T.shaderID?v.push(T.shaderID):(v.push(T.customVertexShaderID),v.push(T.customFragmentShaderID)),T.defines!==void 0)for(const R in T.defines)v.push(R),v.push(T.defines[R]);return T.isRawShaderMaterial===!1&&(M(v,T),x(v,T),v.push(i.outputColorSpace)),v.push(T.customProgramCacheKey),v.join()}function M(T,v){T.push(v.precision),T.push(v.outputColorSpace),T.push(v.envMapMode),T.push(v.envMapCubeUVHeight),T.push(v.mapUv),T.push(v.alphaMapUv),T.push(v.lightMapUv),T.push(v.aoMapUv),T.push(v.bumpMapUv),T.push(v.normalMapUv),T.push(v.displacementMapUv),T.push(v.emissiveMapUv),T.push(v.metalnessMapUv),T.push(v.roughnessMapUv),T.push(v.anisotropyMapUv),T.push(v.clearcoatMapUv),T.push(v.clearcoatNormalMapUv),T.push(v.clearcoatRoughnessMapUv),T.push(v.iridescenceMapUv),T.push(v.iridescenceThicknessMapUv),T.push(v.sheenColorMapUv),T.push(v.sheenRoughnessMapUv),T.push(v.specularMapUv),T.push(v.specularColorMapUv),T.push(v.specularIntensityMapUv),T.push(v.transmissionMapUv),T.push(v.thicknessMapUv),T.push(v.combine),T.push(v.fogExp2),T.push(v.sizeAttenuation),T.push(v.morphTargetsCount),T.push(v.morphAttributeCount),T.push(v.numDirLights),T.push(v.numPointLights),T.push(v.numSpotLights),T.push(v.numSpotLightMaps),T.push(v.numHemiLights),T.push(v.numRectAreaLights),T.push(v.numDirLightShadows),T.push(v.numPointLightShadows),T.push(v.numSpotLightShadows),T.push(v.numSpotLightShadowsWithMaps),T.push(v.numLightProbes),T.push(v.shadowMapType),T.push(v.toneMapping),T.push(v.numClippingPlanes),T.push(v.numClipIntersection),T.push(v.depthPacking)}function x(T,v){a.disableAll(),v.supportsVertexTextures&&a.enable(0),v.instancing&&a.enable(1),v.instancingColor&&a.enable(2),v.instancingMorph&&a.enable(3),v.matcap&&a.enable(4),v.envMap&&a.enable(5),v.normalMapObjectSpace&&a.enable(6),v.normalMapTangentSpace&&a.enable(7),v.clearcoat&&a.enable(8),v.iridescence&&a.enable(9),v.alphaTest&&a.enable(10),v.vertexColors&&a.enable(11),v.vertexAlphas&&a.enable(12),v.vertexUv1s&&a.enable(13),v.vertexUv2s&&a.enable(14),v.vertexUv3s&&a.enable(15),v.vertexTangents&&a.enable(16),v.anisotropy&&a.enable(17),v.alphaHash&&a.enable(18),v.batching&&a.enable(19),v.dispersion&&a.enable(20),v.batchingColor&&a.enable(21),T.push(a.mask),a.disableAll(),v.fog&&a.enable(0),v.useFog&&a.enable(1),v.flatShading&&a.enable(2),v.logarithmicDepthBuffer&&a.enable(3),v.skinning&&a.enable(4),v.morphTargets&&a.enable(5),v.morphNormals&&a.enable(6),v.morphColors&&a.enable(7),v.premultipliedAlpha&&a.enable(8),v.shadowMapEnabled&&a.enable(9),v.doubleSided&&a.enable(10),v.flipSided&&a.enable(11),v.useDepthPacking&&a.enable(12),v.dithering&&a.enable(13),v.transmission&&a.enable(14),v.sheen&&a.enable(15),v.opaque&&a.enable(16),v.pointsUvs&&a.enable(17),v.decodeVideoTexture&&a.enable(18),v.alphaToCoverage&&a.enable(19),T.push(a.mask)}function E(T){const v=g[T.type];let R;if(v){const L=yn[v];R=jf.clone(L.uniforms)}else R=T.uniforms;return R}function A(T,v){let R;for(let L=0,D=h.length;L<D;L++){const N=h[L];if(N.cacheKey===v){R=N,++R.usedTimes;break}}return R===void 0&&(R=new o_(i,v,T,r),h.push(R)),R}function b(T){if(--T.usedTimes===0){const v=h.indexOf(T);h[v]=h[h.length-1],h.pop(),T.destroy()}}function S(T){l.remove(T)}function P(){l.dispose()}return{getParameters:m,getProgramCacheKey:p,getUniforms:E,acquireProgram:A,releaseProgram:b,releaseShaderCache:S,programs:h,dispose:P}}function h_(){let i=new WeakMap;function t(r){let o=i.get(r);return o===void 0&&(o={},i.set(r,o)),o}function e(r){i.delete(r)}function n(r,o,a){i.get(r)[o]=a}function s(){i=new WeakMap}return{get:t,remove:e,update:n,dispose:s}}function f_(i,t){return i.groupOrder!==t.groupOrder?i.groupOrder-t.groupOrder:i.renderOrder!==t.renderOrder?i.renderOrder-t.renderOrder:i.material.id!==t.material.id?i.material.id-t.material.id:i.z!==t.z?i.z-t.z:i.id-t.id}function gc(i,t){return i.groupOrder!==t.groupOrder?i.groupOrder-t.groupOrder:i.renderOrder!==t.renderOrder?i.renderOrder-t.renderOrder:i.z!==t.z?t.z-i.z:i.id-t.id}function _c(){const i=[];let t=0;const e=[],n=[],s=[];function r(){t=0,e.length=0,n.length=0,s.length=0}function o(f,u,d,g,_,m){let p=i[t];return p===void 0?(p={id:f.id,object:f,geometry:u,material:d,groupOrder:g,renderOrder:f.renderOrder,z:_,group:m},i[t]=p):(p.id=f.id,p.object=f,p.geometry=u,p.material=d,p.groupOrder=g,p.renderOrder=f.renderOrder,p.z=_,p.group=m),t++,p}function a(f,u,d,g,_,m){const p=o(f,u,d,g,_,m);d.transmission>0?n.push(p):d.transparent===!0?s.push(p):e.push(p)}function l(f,u,d,g,_,m){const p=o(f,u,d,g,_,m);d.transmission>0?n.unshift(p):d.transparent===!0?s.unshift(p):e.unshift(p)}function c(f,u){e.length>1&&e.sort(f||f_),n.length>1&&n.sort(u||gc),s.length>1&&s.sort(u||gc)}function h(){for(let f=t,u=i.length;f<u;f++){const d=i[f];if(d.id===null)break;d.id=null,d.object=null,d.geometry=null,d.material=null,d.group=null}}return{opaque:e,transmissive:n,transparent:s,init:r,push:a,unshift:l,finish:h,sort:c}}function d_(){let i=new WeakMap;function t(n,s){const r=i.get(n);let o;return r===void 0?(o=new _c,i.set(n,[o])):s>=r.length?(o=new _c,r.push(o)):o=r[s],o}function e(){i=new WeakMap}return{get:t,dispose:e}}function p_(){const i={};return{get:function(t){if(i[t.id]!==void 0)return i[t.id];let e;switch(t.type){case"DirectionalLight":e={direction:new I,color:new jt};break;case"SpotLight":e={position:new I,direction:new I,color:new jt,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":e={position:new I,color:new jt,distance:0,decay:0};break;case"HemisphereLight":e={direction:new I,skyColor:new jt,groundColor:new jt};break;case"RectAreaLight":e={color:new jt,position:new I,halfWidth:new I,halfHeight:new I};break}return i[t.id]=e,e}}}function m_(){const i={};return{get:function(t){if(i[t.id]!==void 0)return i[t.id];let e;switch(t.type){case"DirectionalLight":e={shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new At};break;case"SpotLight":e={shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new At};break;case"PointLight":e={shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new At,shadowCameraNear:1,shadowCameraFar:1e3};break}return i[t.id]=e,e}}}let g_=0;function __(i,t){return(t.castShadow?2:0)-(i.castShadow?2:0)+(t.map?1:0)-(i.map?1:0)}function x_(i){const t=new p_,e=m_(),n={version:0,hash:{directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let c=0;c<9;c++)n.probe.push(new I);const s=new I,r=new Kt,o=new Kt;function a(c){let h=0,f=0,u=0;for(let T=0;T<9;T++)n.probe[T].set(0,0,0);let d=0,g=0,_=0,m=0,p=0,M=0,x=0,E=0,A=0,b=0,S=0;c.sort(__);for(let T=0,v=c.length;T<v;T++){const R=c[T],L=R.color,D=R.intensity,N=R.distance,z=R.shadow&&R.shadow.map?R.shadow.map.texture:null;if(R.isAmbientLight)h+=L.r*D,f+=L.g*D,u+=L.b*D;else if(R.isLightProbe){for(let O=0;O<9;O++)n.probe[O].addScaledVector(R.sh.coefficients[O],D);S++}else if(R.isDirectionalLight){const O=t.get(R);if(O.color.copy(R.color).multiplyScalar(R.intensity),R.castShadow){const Y=R.shadow,B=e.get(R);B.shadowBias=Y.bias,B.shadowNormalBias=Y.normalBias,B.shadowRadius=Y.radius,B.shadowMapSize=Y.mapSize,n.directionalShadow[d]=B,n.directionalShadowMap[d]=z,n.directionalShadowMatrix[d]=R.shadow.matrix,M++}n.directional[d]=O,d++}else if(R.isSpotLight){const O=t.get(R);O.position.setFromMatrixPosition(R.matrixWorld),O.color.copy(L).multiplyScalar(D),O.distance=N,O.coneCos=Math.cos(R.angle),O.penumbraCos=Math.cos(R.angle*(1-R.penumbra)),O.decay=R.decay,n.spot[_]=O;const Y=R.shadow;if(R.map&&(n.spotLightMap[A]=R.map,A++,Y.updateMatrices(R),R.castShadow&&b++),n.spotLightMatrix[_]=Y.matrix,R.castShadow){const B=e.get(R);B.shadowBias=Y.bias,B.shadowNormalBias=Y.normalBias,B.shadowRadius=Y.radius,B.shadowMapSize=Y.mapSize,n.spotShadow[_]=B,n.spotShadowMap[_]=z,E++}_++}else if(R.isRectAreaLight){const O=t.get(R);O.color.copy(L).multiplyScalar(D),O.halfWidth.set(R.width*.5,0,0),O.halfHeight.set(0,R.height*.5,0),n.rectArea[m]=O,m++}else if(R.isPointLight){const O=t.get(R);if(O.color.copy(R.color).multiplyScalar(R.intensity),O.distance=R.distance,O.decay=R.decay,R.castShadow){const Y=R.shadow,B=e.get(R);B.shadowBias=Y.bias,B.shadowNormalBias=Y.normalBias,B.shadowRadius=Y.radius,B.shadowMapSize=Y.mapSize,B.shadowCameraNear=Y.camera.near,B.shadowCameraFar=Y.camera.far,n.pointShadow[g]=B,n.pointShadowMap[g]=z,n.pointShadowMatrix[g]=R.shadow.matrix,x++}n.point[g]=O,g++}else if(R.isHemisphereLight){const O=t.get(R);O.skyColor.copy(R.color).multiplyScalar(D),O.groundColor.copy(R.groundColor).multiplyScalar(D),n.hemi[p]=O,p++}}m>0&&(i.has("OES_texture_float_linear")===!0?(n.rectAreaLTC1=ut.LTC_FLOAT_1,n.rectAreaLTC2=ut.LTC_FLOAT_2):(n.rectAreaLTC1=ut.LTC_HALF_1,n.rectAreaLTC2=ut.LTC_HALF_2)),n.ambient[0]=h,n.ambient[1]=f,n.ambient[2]=u;const P=n.hash;(P.directionalLength!==d||P.pointLength!==g||P.spotLength!==_||P.rectAreaLength!==m||P.hemiLength!==p||P.numDirectionalShadows!==M||P.numPointShadows!==x||P.numSpotShadows!==E||P.numSpotMaps!==A||P.numLightProbes!==S)&&(n.directional.length=d,n.spot.length=_,n.rectArea.length=m,n.point.length=g,n.hemi.length=p,n.directionalShadow.length=M,n.directionalShadowMap.length=M,n.pointShadow.length=x,n.pointShadowMap.length=x,n.spotShadow.length=E,n.spotShadowMap.length=E,n.directionalShadowMatrix.length=M,n.pointShadowMatrix.length=x,n.spotLightMatrix.length=E+A-b,n.spotLightMap.length=A,n.numSpotLightShadowsWithMaps=b,n.numLightProbes=S,P.directionalLength=d,P.pointLength=g,P.spotLength=_,P.rectAreaLength=m,P.hemiLength=p,P.numDirectionalShadows=M,P.numPointShadows=x,P.numSpotShadows=E,P.numSpotMaps=A,P.numLightProbes=S,n.version=g_++)}function l(c,h){let f=0,u=0,d=0,g=0,_=0;const m=h.matrixWorldInverse;for(let p=0,M=c.length;p<M;p++){const x=c[p];if(x.isDirectionalLight){const E=n.directional[f];E.direction.setFromMatrixPosition(x.matrixWorld),s.setFromMatrixPosition(x.target.matrixWorld),E.direction.sub(s),E.direction.transformDirection(m),f++}else if(x.isSpotLight){const E=n.spot[d];E.position.setFromMatrixPosition(x.matrixWorld),E.position.applyMatrix4(m),E.direction.setFromMatrixPosition(x.matrixWorld),s.setFromMatrixPosition(x.target.matrixWorld),E.direction.sub(s),E.direction.transformDirection(m),d++}else if(x.isRectAreaLight){const E=n.rectArea[g];E.position.setFromMatrixPosition(x.matrixWorld),E.position.applyMatrix4(m),o.identity(),r.copy(x.matrixWorld),r.premultiply(m),o.extractRotation(r),E.halfWidth.set(x.width*.5,0,0),E.halfHeight.set(0,x.height*.5,0),E.halfWidth.applyMatrix4(o),E.halfHeight.applyMatrix4(o),g++}else if(x.isPointLight){const E=n.point[u];E.position.setFromMatrixPosition(x.matrixWorld),E.position.applyMatrix4(m),u++}else if(x.isHemisphereLight){const E=n.hemi[_];E.direction.setFromMatrixPosition(x.matrixWorld),E.direction.transformDirection(m),_++}}}return{setup:a,setupView:l,state:n}}function xc(i){const t=new x_(i),e=[],n=[];function s(h){c.camera=h,e.length=0,n.length=0}function r(h){e.push(h)}function o(h){n.push(h)}function a(){t.setup(e)}function l(h){t.setupView(e,h)}const c={lightsArray:e,shadowsArray:n,camera:null,lights:t,transmissionRenderTarget:{}};return{init:s,state:c,setupLights:a,setupLightsView:l,pushLight:r,pushShadow:o}}function v_(i){let t=new WeakMap;function e(s,r=0){const o=t.get(s);let a;return o===void 0?(a=new xc(i),t.set(s,[a])):r>=o.length?(a=new xc(i),o.push(a)):a=o[r],a}function n(){t=new WeakMap}return{get:e,dispose:n}}class M_ extends Ts{constructor(t){super(),this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=_f,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(t)}copy(t){return super.copy(t),this.depthPacking=t.depthPacking,this.map=t.map,this.alphaMap=t.alphaMap,this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this}}class S_ extends Ts{constructor(t){super(),this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(t)}copy(t){return super.copy(t),this.map=t.map,this.alphaMap=t.alphaMap,this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this}}const y_=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,E_=`uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;
#include <packing>
void main() {
	const float samples = float( VSM_SAMPLES );
	float mean = 0.0;
	float squared_mean = 0.0;
	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );
	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;
	for ( float i = 0.0; i < samples; i ++ ) {
		float uvOffset = uvStart + i * uvStride;
		#ifdef HORIZONTAL_PASS
			vec2 distribution = unpackRGBATo2Half( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ) );
			mean += distribution.x;
			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;
		#else
			float depth = unpackRGBAToDepth( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ) );
			mean += depth;
			squared_mean += depth * depth;
		#endif
	}
	mean = mean / samples;
	squared_mean = squared_mean / samples;
	float std_dev = sqrt( squared_mean - mean * mean );
	gl_FragColor = pack2HalfToRGBA( vec2( mean, std_dev ) );
}`;function T_(i,t,e){let n=new Va;const s=new At,r=new At,o=new Ee,a=new M_({depthPacking:xf}),l=new S_,c={},h=e.maxTextureSize,f={[wn]:Fe,[Fe]:wn,[En]:En},u=new ci({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new At},radius:{value:4}},vertexShader:y_,fragmentShader:E_}),d=u.clone();d.defines.HORIZONTAL_PASS=1;const g=new We;g.setAttribute("position",new Je(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));const _=new me(g,u),m=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=_u;let p=this.type;this.render=function(b,S,P){if(m.enabled===!1||m.autoUpdate===!1&&m.needsUpdate===!1||b.length===0)return;const T=i.getRenderTarget(),v=i.getActiveCubeFace(),R=i.getActiveMipmapLevel(),L=i.state;L.setBlending(oi),L.buffers.color.setClear(1,1,1,1),L.buffers.depth.setTest(!0),L.setScissorTest(!1);const D=p!==On&&this.type===On,N=p===On&&this.type!==On;for(let z=0,O=b.length;z<O;z++){const Y=b[z],B=Y.shadow;if(B===void 0){console.warn("THREE.WebGLShadowMap:",Y,"has no shadow.");continue}if(B.autoUpdate===!1&&B.needsUpdate===!1)continue;s.copy(B.mapSize);const it=B.getFrameExtents();if(s.multiply(it),r.copy(B.mapSize),(s.x>h||s.y>h)&&(s.x>h&&(r.x=Math.floor(h/it.x),s.x=r.x*it.x,B.mapSize.x=r.x),s.y>h&&(r.y=Math.floor(h/it.y),s.y=r.y*it.y,B.mapSize.y=r.y)),B.map===null||D===!0||N===!0){const ht=this.type!==On?{minFilter:rn,magFilter:rn}:{};B.map!==null&&B.map.dispose(),B.map=new Ri(s.x,s.y,ht),B.map.texture.name=Y.name+".shadowMap",B.camera.updateProjectionMatrix()}i.setRenderTarget(B.map),i.clear();const st=B.getViewportCount();for(let ht=0;ht<st;ht++){const Pt=B.getViewport(ht);o.set(r.x*Pt.x,r.y*Pt.y,r.x*Pt.z,r.y*Pt.w),L.viewport(o),B.updateMatrices(Y,ht),n=B.getFrustum(),E(S,P,B.camera,Y,this.type)}B.isPointLightShadow!==!0&&this.type===On&&M(B,P),B.needsUpdate=!1}p=this.type,m.needsUpdate=!1,i.setRenderTarget(T,v,R)};function M(b,S){const P=t.update(_);u.defines.VSM_SAMPLES!==b.blurSamples&&(u.defines.VSM_SAMPLES=b.blurSamples,d.defines.VSM_SAMPLES=b.blurSamples,u.needsUpdate=!0,d.needsUpdate=!0),b.mapPass===null&&(b.mapPass=new Ri(s.x,s.y)),u.uniforms.shadow_pass.value=b.map.texture,u.uniforms.resolution.value=b.mapSize,u.uniforms.radius.value=b.radius,i.setRenderTarget(b.mapPass),i.clear(),i.renderBufferDirect(S,null,P,u,_,null),d.uniforms.shadow_pass.value=b.mapPass.texture,d.uniforms.resolution.value=b.mapSize,d.uniforms.radius.value=b.radius,i.setRenderTarget(b.map),i.clear(),i.renderBufferDirect(S,null,P,d,_,null)}function x(b,S,P,T){let v=null;const R=P.isPointLight===!0?b.customDistanceMaterial:b.customDepthMaterial;if(R!==void 0)v=R;else if(v=P.isPointLight===!0?l:a,i.localClippingEnabled&&S.clipShadows===!0&&Array.isArray(S.clippingPlanes)&&S.clippingPlanes.length!==0||S.displacementMap&&S.displacementScale!==0||S.alphaMap&&S.alphaTest>0||S.map&&S.alphaTest>0){const L=v.uuid,D=S.uuid;let N=c[L];N===void 0&&(N={},c[L]=N);let z=N[D];z===void 0&&(z=v.clone(),N[D]=z,S.addEventListener("dispose",A)),v=z}if(v.visible=S.visible,v.wireframe=S.wireframe,T===On?v.side=S.shadowSide!==null?S.shadowSide:S.side:v.side=S.shadowSide!==null?S.shadowSide:f[S.side],v.alphaMap=S.alphaMap,v.alphaTest=S.alphaTest,v.map=S.map,v.clipShadows=S.clipShadows,v.clippingPlanes=S.clippingPlanes,v.clipIntersection=S.clipIntersection,v.displacementMap=S.displacementMap,v.displacementScale=S.displacementScale,v.displacementBias=S.displacementBias,v.wireframeLinewidth=S.wireframeLinewidth,v.linewidth=S.linewidth,P.isPointLight===!0&&v.isMeshDistanceMaterial===!0){const L=i.properties.get(v);L.light=P}return v}function E(b,S,P,T,v){if(b.visible===!1)return;if(b.layers.test(S.layers)&&(b.isMesh||b.isLine||b.isPoints)&&(b.castShadow||b.receiveShadow&&v===On)&&(!b.frustumCulled||n.intersectsObject(b))){b.modelViewMatrix.multiplyMatrices(P.matrixWorldInverse,b.matrixWorld);const D=t.update(b),N=b.material;if(Array.isArray(N)){const z=D.groups;for(let O=0,Y=z.length;O<Y;O++){const B=z[O],it=N[B.materialIndex];if(it&&it.visible){const st=x(b,it,T,v);b.onBeforeShadow(i,b,S,P,D,st,B),i.renderBufferDirect(P,null,D,st,b,B),b.onAfterShadow(i,b,S,P,D,st,B)}}}else if(N.visible){const z=x(b,N,T,v);b.onBeforeShadow(i,b,S,P,D,z,null),i.renderBufferDirect(P,null,D,z,b,null),b.onAfterShadow(i,b,S,P,D,z,null)}}const L=b.children;for(let D=0,N=L.length;D<N;D++)E(L[D],S,P,T,v)}function A(b){b.target.removeEventListener("dispose",A);for(const P in c){const T=c[P],v=b.target.uuid;v in T&&(T[v].dispose(),delete T[v])}}}function b_(i){function t(){let y=!1;const q=new Ee;let G=null;const j=new Ee(0,0,0,0);return{setMask:function(Q){G!==Q&&!y&&(i.colorMask(Q,Q,Q,Q),G=Q)},setLocked:function(Q){y=Q},setClear:function(Q,Mt,St,te,ce){ce===!0&&(Q*=te,Mt*=te,St*=te),q.set(Q,Mt,St,te),j.equals(q)===!1&&(i.clearColor(Q,Mt,St,te),j.copy(q))},reset:function(){y=!1,G=null,j.set(-1,0,0,0)}}}function e(){let y=!1,q=null,G=null,j=null;return{setTest:function(Q){Q?pt(i.DEPTH_TEST):lt(i.DEPTH_TEST)},setMask:function(Q){q!==Q&&!y&&(i.depthMask(Q),q=Q)},setFunc:function(Q){if(G!==Q){switch(Q){case Vh:i.depthFunc(i.NEVER);break;case Wh:i.depthFunc(i.ALWAYS);break;case Xh:i.depthFunc(i.LESS);break;case Jr:i.depthFunc(i.LEQUAL);break;case qh:i.depthFunc(i.EQUAL);break;case Yh:i.depthFunc(i.GEQUAL);break;case jh:i.depthFunc(i.GREATER);break;case Kh:i.depthFunc(i.NOTEQUAL);break;default:i.depthFunc(i.LEQUAL)}G=Q}},setLocked:function(Q){y=Q},setClear:function(Q){j!==Q&&(i.clearDepth(Q),j=Q)},reset:function(){y=!1,q=null,G=null,j=null}}}function n(){let y=!1,q=null,G=null,j=null,Q=null,Mt=null,St=null,te=null,ce=null;return{setTest:function(Yt){y||(Yt?pt(i.STENCIL_TEST):lt(i.STENCIL_TEST))},setMask:function(Yt){q!==Yt&&!y&&(i.stencilMask(Yt),q=Yt)},setFunc:function(Yt,le,ue){(G!==Yt||j!==le||Q!==ue)&&(i.stencilFunc(Yt,le,ue),G=Yt,j=le,Q=ue)},setOp:function(Yt,le,ue){(Mt!==Yt||St!==le||te!==ue)&&(i.stencilOp(Yt,le,ue),Mt=Yt,St=le,te=ue)},setLocked:function(Yt){y=Yt},setClear:function(Yt){ce!==Yt&&(i.clearStencil(Yt),ce=Yt)},reset:function(){y=!1,q=null,G=null,j=null,Q=null,Mt=null,St=null,te=null,ce=null}}}const s=new t,r=new e,o=new n,a=new WeakMap,l=new WeakMap;let c={},h={},f=new WeakMap,u=[],d=null,g=!1,_=null,m=null,p=null,M=null,x=null,E=null,A=null,b=new jt(0,0,0),S=0,P=!1,T=null,v=null,R=null,L=null,D=null;const N=i.getParameter(i.MAX_COMBINED_TEXTURE_IMAGE_UNITS);let z=!1,O=0;const Y=i.getParameter(i.VERSION);Y.indexOf("WebGL")!==-1?(O=parseFloat(/^WebGL (\d)/.exec(Y)[1]),z=O>=1):Y.indexOf("OpenGL ES")!==-1&&(O=parseFloat(/^OpenGL ES (\d)/.exec(Y)[1]),z=O>=2);let B=null,it={};const st=i.getParameter(i.SCISSOR_BOX),ht=i.getParameter(i.VIEWPORT),Pt=new Ee().fromArray(st),Wt=new Ee().fromArray(ht);function K(y,q,G,j){const Q=new Uint8Array(4),Mt=i.createTexture();i.bindTexture(y,Mt),i.texParameteri(y,i.TEXTURE_MIN_FILTER,i.NEAREST),i.texParameteri(y,i.TEXTURE_MAG_FILTER,i.NEAREST);for(let St=0;St<G;St++)y===i.TEXTURE_3D||y===i.TEXTURE_2D_ARRAY?i.texImage3D(q,0,i.RGBA,1,1,j,0,i.RGBA,i.UNSIGNED_BYTE,Q):i.texImage2D(q+St,0,i.RGBA,1,1,0,i.RGBA,i.UNSIGNED_BYTE,Q);return Mt}const et={};et[i.TEXTURE_2D]=K(i.TEXTURE_2D,i.TEXTURE_2D,1),et[i.TEXTURE_CUBE_MAP]=K(i.TEXTURE_CUBE_MAP,i.TEXTURE_CUBE_MAP_POSITIVE_X,6),et[i.TEXTURE_2D_ARRAY]=K(i.TEXTURE_2D_ARRAY,i.TEXTURE_2D_ARRAY,1,1),et[i.TEXTURE_3D]=K(i.TEXTURE_3D,i.TEXTURE_3D,1,1),s.setClear(0,0,0,1),r.setClear(1),o.setClear(0),pt(i.DEPTH_TEST),r.setFunc(Jr),_t(!1),Ht(Qa),pt(i.CULL_FACE),zt(oi);function pt(y){c[y]!==!0&&(i.enable(y),c[y]=!0)}function lt(y){c[y]!==!1&&(i.disable(y),c[y]=!1)}function Ot(y,q){return h[y]!==q?(i.bindFramebuffer(y,q),h[y]=q,y===i.DRAW_FRAMEBUFFER&&(h[i.FRAMEBUFFER]=q),y===i.FRAMEBUFFER&&(h[i.DRAW_FRAMEBUFFER]=q),!0):!1}function Rt(y,q){let G=u,j=!1;if(y){G=f.get(q),G===void 0&&(G=[],f.set(q,G));const Q=y.textures;if(G.length!==Q.length||G[0]!==i.COLOR_ATTACHMENT0){for(let Mt=0,St=Q.length;Mt<St;Mt++)G[Mt]=i.COLOR_ATTACHMENT0+Mt;G.length=Q.length,j=!0}}else G[0]!==i.BACK&&(G[0]=i.BACK,j=!0);j&&i.drawBuffers(G)}function Xt(y){return d!==y?(i.useProgram(y),d=y,!0):!1}const F={[Ei]:i.FUNC_ADD,[Ah]:i.FUNC_SUBTRACT,[wh]:i.FUNC_REVERSE_SUBTRACT};F[Rh]=i.MIN,F[Ch]=i.MAX;const qt={[Ph]:i.ZERO,[Lh]:i.ONE,[Dh]:i.SRC_COLOR,[Ma]:i.SRC_ALPHA,[zh]:i.SRC_ALPHA_SATURATE,[Fh]:i.DST_COLOR,[Ih]:i.DST_ALPHA,[Uh]:i.ONE_MINUS_SRC_COLOR,[Sa]:i.ONE_MINUS_SRC_ALPHA,[Oh]:i.ONE_MINUS_DST_COLOR,[Nh]:i.ONE_MINUS_DST_ALPHA,[Bh]:i.CONSTANT_COLOR,[kh]:i.ONE_MINUS_CONSTANT_COLOR,[Hh]:i.CONSTANT_ALPHA,[Gh]:i.ONE_MINUS_CONSTANT_ALPHA};function zt(y,q,G,j,Q,Mt,St,te,ce,Yt){if(y===oi){g===!0&&(lt(i.BLEND),g=!1);return}if(g===!1&&(pt(i.BLEND),g=!0),y!==bh){if(y!==_||Yt!==P){if((m!==Ei||x!==Ei)&&(i.blendEquation(i.FUNC_ADD),m=Ei,x=Ei),Yt)switch(y){case ms:i.blendFuncSeparate(i.ONE,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case tl:i.blendFunc(i.ONE,i.ONE);break;case el:i.blendFuncSeparate(i.ZERO,i.ONE_MINUS_SRC_COLOR,i.ZERO,i.ONE);break;case nl:i.blendFuncSeparate(i.ZERO,i.SRC_COLOR,i.ZERO,i.SRC_ALPHA);break;default:console.error("THREE.WebGLState: Invalid blending: ",y);break}else switch(y){case ms:i.blendFuncSeparate(i.SRC_ALPHA,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case tl:i.blendFunc(i.SRC_ALPHA,i.ONE);break;case el:i.blendFuncSeparate(i.ZERO,i.ONE_MINUS_SRC_COLOR,i.ZERO,i.ONE);break;case nl:i.blendFunc(i.ZERO,i.SRC_COLOR);break;default:console.error("THREE.WebGLState: Invalid blending: ",y);break}p=null,M=null,E=null,A=null,b.set(0,0,0),S=0,_=y,P=Yt}return}Q=Q||q,Mt=Mt||G,St=St||j,(q!==m||Q!==x)&&(i.blendEquationSeparate(F[q],F[Q]),m=q,x=Q),(G!==p||j!==M||Mt!==E||St!==A)&&(i.blendFuncSeparate(qt[G],qt[j],qt[Mt],qt[St]),p=G,M=j,E=Mt,A=St),(te.equals(b)===!1||ce!==S)&&(i.blendColor(te.r,te.g,te.b,ce),b.copy(te),S=ce),_=y,P=!1}function Qt(y,q){y.side===En?lt(i.CULL_FACE):pt(i.CULL_FACE);let G=y.side===Fe;q&&(G=!G),_t(G),y.blending===ms&&y.transparent===!1?zt(oi):zt(y.blending,y.blendEquation,y.blendSrc,y.blendDst,y.blendEquationAlpha,y.blendSrcAlpha,y.blendDstAlpha,y.blendColor,y.blendAlpha,y.premultipliedAlpha),r.setFunc(y.depthFunc),r.setTest(y.depthTest),r.setMask(y.depthWrite),s.setMask(y.colorWrite);const j=y.stencilWrite;o.setTest(j),j&&(o.setMask(y.stencilWriteMask),o.setFunc(y.stencilFunc,y.stencilRef,y.stencilFuncMask),o.setOp(y.stencilFail,y.stencilZFail,y.stencilZPass)),wt(y.polygonOffset,y.polygonOffsetFactor,y.polygonOffsetUnits),y.alphaToCoverage===!0?pt(i.SAMPLE_ALPHA_TO_COVERAGE):lt(i.SAMPLE_ALPHA_TO_COVERAGE)}function _t(y){T!==y&&(y?i.frontFace(i.CW):i.frontFace(i.CCW),T=y)}function Ht(y){y!==yh?(pt(i.CULL_FACE),y!==v&&(y===Qa?i.cullFace(i.BACK):y===Eh?i.cullFace(i.FRONT):i.cullFace(i.FRONT_AND_BACK))):lt(i.CULL_FACE),v=y}function Bt(y){y!==R&&(z&&i.lineWidth(y),R=y)}function wt(y,q,G){y?(pt(i.POLYGON_OFFSET_FILL),(L!==q||D!==G)&&(i.polygonOffset(q,G),L=q,D=G)):lt(i.POLYGON_OFFSET_FILL)}function $t(y){y?pt(i.SCISSOR_TEST):lt(i.SCISSOR_TEST)}function U(y){y===void 0&&(y=i.TEXTURE0+N-1),B!==y&&(i.activeTexture(y),B=y)}function w(y,q,G){G===void 0&&(B===null?G=i.TEXTURE0+N-1:G=B);let j=it[G];j===void 0&&(j={type:void 0,texture:void 0},it[G]=j),(j.type!==y||j.texture!==q)&&(B!==G&&(i.activeTexture(G),B=G),i.bindTexture(y,q||et[y]),j.type=y,j.texture=q)}function X(){const y=it[B];y!==void 0&&y.type!==void 0&&(i.bindTexture(y.type,null),y.type=void 0,y.texture=void 0)}function Z(){try{i.compressedTexImage2D.apply(i,arguments)}catch(y){console.error("THREE.WebGLState:",y)}}function tt(){try{i.compressedTexImage3D.apply(i,arguments)}catch(y){console.error("THREE.WebGLState:",y)}}function J(){try{i.texSubImage2D.apply(i,arguments)}catch(y){console.error("THREE.WebGLState:",y)}}function vt(){try{i.texSubImage3D.apply(i,arguments)}catch(y){console.error("THREE.WebGLState:",y)}}function ot(){try{i.compressedTexSubImage2D.apply(i,arguments)}catch(y){console.error("THREE.WebGLState:",y)}}function at(){try{i.compressedTexSubImage3D.apply(i,arguments)}catch(y){console.error("THREE.WebGLState:",y)}}function Ut(){try{i.texStorage2D.apply(i,arguments)}catch(y){console.error("THREE.WebGLState:",y)}}function nt(){try{i.texStorage3D.apply(i,arguments)}catch(y){console.error("THREE.WebGLState:",y)}}function mt(){try{i.texImage2D.apply(i,arguments)}catch(y){console.error("THREE.WebGLState:",y)}}function kt(){try{i.texImage3D.apply(i,arguments)}catch(y){console.error("THREE.WebGLState:",y)}}function Et(y){Pt.equals(y)===!1&&(i.scissor(y.x,y.y,y.z,y.w),Pt.copy(y))}function ct(y){Wt.equals(y)===!1&&(i.viewport(y.x,y.y,y.z,y.w),Wt.copy(y))}function It(y,q){let G=l.get(q);G===void 0&&(G=new WeakMap,l.set(q,G));let j=G.get(y);j===void 0&&(j=i.getUniformBlockIndex(q,y.name),G.set(y,j))}function Tt(y,q){const j=l.get(q).get(y);a.get(q)!==j&&(i.uniformBlockBinding(q,j,y.__bindingPointIndex),a.set(q,j))}function re(){i.disable(i.BLEND),i.disable(i.CULL_FACE),i.disable(i.DEPTH_TEST),i.disable(i.POLYGON_OFFSET_FILL),i.disable(i.SCISSOR_TEST),i.disable(i.STENCIL_TEST),i.disable(i.SAMPLE_ALPHA_TO_COVERAGE),i.blendEquation(i.FUNC_ADD),i.blendFunc(i.ONE,i.ZERO),i.blendFuncSeparate(i.ONE,i.ZERO,i.ONE,i.ZERO),i.blendColor(0,0,0,0),i.colorMask(!0,!0,!0,!0),i.clearColor(0,0,0,0),i.depthMask(!0),i.depthFunc(i.LESS),i.clearDepth(1),i.stencilMask(4294967295),i.stencilFunc(i.ALWAYS,0,4294967295),i.stencilOp(i.KEEP,i.KEEP,i.KEEP),i.clearStencil(0),i.cullFace(i.BACK),i.frontFace(i.CCW),i.polygonOffset(0,0),i.activeTexture(i.TEXTURE0),i.bindFramebuffer(i.FRAMEBUFFER,null),i.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),i.bindFramebuffer(i.READ_FRAMEBUFFER,null),i.useProgram(null),i.lineWidth(1),i.scissor(0,0,i.canvas.width,i.canvas.height),i.viewport(0,0,i.canvas.width,i.canvas.height),c={},B=null,it={},h={},f=new WeakMap,u=[],d=null,g=!1,_=null,m=null,p=null,M=null,x=null,E=null,A=null,b=new jt(0,0,0),S=0,P=!1,T=null,v=null,R=null,L=null,D=null,Pt.set(0,0,i.canvas.width,i.canvas.height),Wt.set(0,0,i.canvas.width,i.canvas.height),s.reset(),r.reset(),o.reset()}return{buffers:{color:s,depth:r,stencil:o},enable:pt,disable:lt,bindFramebuffer:Ot,drawBuffers:Rt,useProgram:Xt,setBlending:zt,setMaterial:Qt,setFlipSided:_t,setCullFace:Ht,setLineWidth:Bt,setPolygonOffset:wt,setScissorTest:$t,activeTexture:U,bindTexture:w,unbindTexture:X,compressedTexImage2D:Z,compressedTexImage3D:tt,texImage2D:mt,texImage3D:kt,updateUBOMapping:It,uniformBlockBinding:Tt,texStorage2D:Ut,texStorage3D:nt,texSubImage2D:J,texSubImage3D:vt,compressedTexSubImage2D:ot,compressedTexSubImage3D:at,scissor:Et,viewport:ct,reset:re}}function A_(i,t,e,n,s,r,o){const a=t.has("WEBGL_multisampled_render_to_texture")?t.get("WEBGL_multisampled_render_to_texture"):null,l=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),c=new At,h=new WeakMap;let f;const u=new WeakMap;let d=!1;try{d=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function g(U,w){return d?new OffscreenCanvas(U,w):so("canvas")}function _(U,w,X){let Z=1;const tt=$t(U);if((tt.width>X||tt.height>X)&&(Z=X/Math.max(tt.width,tt.height)),Z<1)if(typeof HTMLImageElement<"u"&&U instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&U instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&U instanceof ImageBitmap||typeof VideoFrame<"u"&&U instanceof VideoFrame){const J=Math.floor(Z*tt.width),vt=Math.floor(Z*tt.height);f===void 0&&(f=g(J,vt));const ot=w?g(J,vt):f;return ot.width=J,ot.height=vt,ot.getContext("2d").drawImage(U,0,0,J,vt),console.warn("THREE.WebGLRenderer: Texture has been resized from ("+tt.width+"x"+tt.height+") to ("+J+"x"+vt+")."),ot}else return"data"in U&&console.warn("THREE.WebGLRenderer: Image in DataTexture is too big ("+tt.width+"x"+tt.height+")."),U;return U}function m(U){return U.generateMipmaps&&U.minFilter!==rn&&U.minFilter!==xn}function p(U){i.generateMipmap(U)}function M(U,w,X,Z,tt=!1){if(U!==null){if(i[U]!==void 0)return i[U];console.warn("THREE.WebGLRenderer: Attempt to use non-existing WebGL internal format '"+U+"'")}let J=w;if(w===i.RED&&(X===i.FLOAT&&(J=i.R32F),X===i.HALF_FLOAT&&(J=i.R16F),X===i.UNSIGNED_BYTE&&(J=i.R8)),w===i.RED_INTEGER&&(X===i.UNSIGNED_BYTE&&(J=i.R8UI),X===i.UNSIGNED_SHORT&&(J=i.R16UI),X===i.UNSIGNED_INT&&(J=i.R32UI),X===i.BYTE&&(J=i.R8I),X===i.SHORT&&(J=i.R16I),X===i.INT&&(J=i.R32I)),w===i.RG&&(X===i.FLOAT&&(J=i.RG32F),X===i.HALF_FLOAT&&(J=i.RG16F),X===i.UNSIGNED_BYTE&&(J=i.RG8)),w===i.RG_INTEGER&&(X===i.UNSIGNED_BYTE&&(J=i.RG8UI),X===i.UNSIGNED_SHORT&&(J=i.RG16UI),X===i.UNSIGNED_INT&&(J=i.RG32UI),X===i.BYTE&&(J=i.RG8I),X===i.SHORT&&(J=i.RG16I),X===i.INT&&(J=i.RG32I)),w===i.RGB&&X===i.UNSIGNED_INT_5_9_9_9_REV&&(J=i.RGB9_E5),w===i.RGBA){const vt=tt?to:ne.getTransfer(Z);X===i.FLOAT&&(J=i.RGBA32F),X===i.HALF_FLOAT&&(J=i.RGBA16F),X===i.UNSIGNED_BYTE&&(J=vt===oe?i.SRGB8_ALPHA8:i.RGBA8),X===i.UNSIGNED_SHORT_4_4_4_4&&(J=i.RGBA4),X===i.UNSIGNED_SHORT_5_5_5_1&&(J=i.RGB5_A1)}return(J===i.R16F||J===i.R32F||J===i.RG16F||J===i.RG32F||J===i.RGBA16F||J===i.RGBA32F)&&t.get("EXT_color_buffer_float"),J}function x(U,w){let X;return U?w===null||w===Ms||w===Ss?X=i.DEPTH24_STENCIL8:w===ni?X=i.DEPTH32F_STENCIL8:w===Qr&&(X=i.DEPTH24_STENCIL8,console.warn("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):w===null||w===Ms||w===Ss?X=i.DEPTH_COMPONENT24:w===ni?X=i.DEPTH_COMPONENT32F:w===Qr&&(X=i.DEPTH_COMPONENT16),X}function E(U,w){return m(U)===!0||U.isFramebufferTexture&&U.minFilter!==rn&&U.minFilter!==xn?Math.log2(Math.max(w.width,w.height))+1:U.mipmaps!==void 0&&U.mipmaps.length>0?U.mipmaps.length:U.isCompressedTexture&&Array.isArray(U.image)?w.mipmaps.length:1}function A(U){const w=U.target;w.removeEventListener("dispose",A),S(w),w.isVideoTexture&&h.delete(w)}function b(U){const w=U.target;w.removeEventListener("dispose",b),T(w)}function S(U){const w=n.get(U);if(w.__webglInit===void 0)return;const X=U.source,Z=u.get(X);if(Z){const tt=Z[w.__cacheKey];tt.usedTimes--,tt.usedTimes===0&&P(U),Object.keys(Z).length===0&&u.delete(X)}n.remove(U)}function P(U){const w=n.get(U);i.deleteTexture(w.__webglTexture);const X=U.source,Z=u.get(X);delete Z[w.__cacheKey],o.memory.textures--}function T(U){const w=n.get(U);if(U.depthTexture&&U.depthTexture.dispose(),U.isWebGLCubeRenderTarget)for(let Z=0;Z<6;Z++){if(Array.isArray(w.__webglFramebuffer[Z]))for(let tt=0;tt<w.__webglFramebuffer[Z].length;tt++)i.deleteFramebuffer(w.__webglFramebuffer[Z][tt]);else i.deleteFramebuffer(w.__webglFramebuffer[Z]);w.__webglDepthbuffer&&i.deleteRenderbuffer(w.__webglDepthbuffer[Z])}else{if(Array.isArray(w.__webglFramebuffer))for(let Z=0;Z<w.__webglFramebuffer.length;Z++)i.deleteFramebuffer(w.__webglFramebuffer[Z]);else i.deleteFramebuffer(w.__webglFramebuffer);if(w.__webglDepthbuffer&&i.deleteRenderbuffer(w.__webglDepthbuffer),w.__webglMultisampledFramebuffer&&i.deleteFramebuffer(w.__webglMultisampledFramebuffer),w.__webglColorRenderbuffer)for(let Z=0;Z<w.__webglColorRenderbuffer.length;Z++)w.__webglColorRenderbuffer[Z]&&i.deleteRenderbuffer(w.__webglColorRenderbuffer[Z]);w.__webglDepthRenderbuffer&&i.deleteRenderbuffer(w.__webglDepthRenderbuffer)}const X=U.textures;for(let Z=0,tt=X.length;Z<tt;Z++){const J=n.get(X[Z]);J.__webglTexture&&(i.deleteTexture(J.__webglTexture),o.memory.textures--),n.remove(X[Z])}n.remove(U)}let v=0;function R(){v=0}function L(){const U=v;return U>=s.maxTextures&&console.warn("THREE.WebGLTextures: Trying to use "+U+" texture units while this GPU supports only "+s.maxTextures),v+=1,U}function D(U){const w=[];return w.push(U.wrapS),w.push(U.wrapT),w.push(U.wrapR||0),w.push(U.magFilter),w.push(U.minFilter),w.push(U.anisotropy),w.push(U.internalFormat),w.push(U.format),w.push(U.type),w.push(U.generateMipmaps),w.push(U.premultiplyAlpha),w.push(U.flipY),w.push(U.unpackAlignment),w.push(U.colorSpace),w.join()}function N(U,w){const X=n.get(U);if(U.isVideoTexture&&Bt(U),U.isRenderTargetTexture===!1&&U.version>0&&X.__version!==U.version){const Z=U.image;if(Z===null)console.warn("THREE.WebGLRenderer: Texture marked for update but no image data found.");else if(Z.complete===!1)console.warn("THREE.WebGLRenderer: Texture marked for update but image is incomplete");else{Wt(X,U,w);return}}e.bindTexture(i.TEXTURE_2D,X.__webglTexture,i.TEXTURE0+w)}function z(U,w){const X=n.get(U);if(U.version>0&&X.__version!==U.version){Wt(X,U,w);return}e.bindTexture(i.TEXTURE_2D_ARRAY,X.__webglTexture,i.TEXTURE0+w)}function O(U,w){const X=n.get(U);if(U.version>0&&X.__version!==U.version){Wt(X,U,w);return}e.bindTexture(i.TEXTURE_3D,X.__webglTexture,i.TEXTURE0+w)}function Y(U,w){const X=n.get(U);if(U.version>0&&X.__version!==U.version){K(X,U,w);return}e.bindTexture(i.TEXTURE_CUBE_MAP,X.__webglTexture,i.TEXTURE0+w)}const B={[Ta]:i.REPEAT,[Ai]:i.CLAMP_TO_EDGE,[ba]:i.MIRRORED_REPEAT},it={[rn]:i.NEAREST,[of]:i.NEAREST_MIPMAP_NEAREST,[er]:i.NEAREST_MIPMAP_LINEAR,[xn]:i.LINEAR,[yo]:i.LINEAR_MIPMAP_NEAREST,[wi]:i.LINEAR_MIPMAP_LINEAR},st={[Mf]:i.NEVER,[Af]:i.ALWAYS,[Sf]:i.LESS,[Au]:i.LEQUAL,[yf]:i.EQUAL,[bf]:i.GEQUAL,[Ef]:i.GREATER,[Tf]:i.NOTEQUAL};function ht(U,w){if(w.type===ni&&t.has("OES_texture_float_linear")===!1&&(w.magFilter===xn||w.magFilter===yo||w.magFilter===er||w.magFilter===wi||w.minFilter===xn||w.minFilter===yo||w.minFilter===er||w.minFilter===wi)&&console.warn("THREE.WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),i.texParameteri(U,i.TEXTURE_WRAP_S,B[w.wrapS]),i.texParameteri(U,i.TEXTURE_WRAP_T,B[w.wrapT]),(U===i.TEXTURE_3D||U===i.TEXTURE_2D_ARRAY)&&i.texParameteri(U,i.TEXTURE_WRAP_R,B[w.wrapR]),i.texParameteri(U,i.TEXTURE_MAG_FILTER,it[w.magFilter]),i.texParameteri(U,i.TEXTURE_MIN_FILTER,it[w.minFilter]),w.compareFunction&&(i.texParameteri(U,i.TEXTURE_COMPARE_MODE,i.COMPARE_REF_TO_TEXTURE),i.texParameteri(U,i.TEXTURE_COMPARE_FUNC,st[w.compareFunction])),t.has("EXT_texture_filter_anisotropic")===!0){if(w.magFilter===rn||w.minFilter!==er&&w.minFilter!==wi||w.type===ni&&t.has("OES_texture_float_linear")===!1)return;if(w.anisotropy>1||n.get(w).__currentAnisotropy){const X=t.get("EXT_texture_filter_anisotropic");i.texParameterf(U,X.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(w.anisotropy,s.getMaxAnisotropy())),n.get(w).__currentAnisotropy=w.anisotropy}}}function Pt(U,w){let X=!1;U.__webglInit===void 0&&(U.__webglInit=!0,w.addEventListener("dispose",A));const Z=w.source;let tt=u.get(Z);tt===void 0&&(tt={},u.set(Z,tt));const J=D(w);if(J!==U.__cacheKey){tt[J]===void 0&&(tt[J]={texture:i.createTexture(),usedTimes:0},o.memory.textures++,X=!0),tt[J].usedTimes++;const vt=tt[U.__cacheKey];vt!==void 0&&(tt[U.__cacheKey].usedTimes--,vt.usedTimes===0&&P(w)),U.__cacheKey=J,U.__webglTexture=tt[J].texture}return X}function Wt(U,w,X){let Z=i.TEXTURE_2D;(w.isDataArrayTexture||w.isCompressedArrayTexture)&&(Z=i.TEXTURE_2D_ARRAY),w.isData3DTexture&&(Z=i.TEXTURE_3D);const tt=Pt(U,w),J=w.source;e.bindTexture(Z,U.__webglTexture,i.TEXTURE0+X);const vt=n.get(J);if(J.version!==vt.__version||tt===!0){e.activeTexture(i.TEXTURE0+X);const ot=ne.getPrimaries(ne.workingColorSpace),at=w.colorSpace===ti?null:ne.getPrimaries(w.colorSpace),Ut=w.colorSpace===ti||ot===at?i.NONE:i.BROWSER_DEFAULT_WEBGL;i.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,w.flipY),i.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,w.premultiplyAlpha),i.pixelStorei(i.UNPACK_ALIGNMENT,w.unpackAlignment),i.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,Ut);let nt=_(w.image,!1,s.maxTextureSize);nt=wt(w,nt);const mt=r.convert(w.format,w.colorSpace),kt=r.convert(w.type);let Et=M(w.internalFormat,mt,kt,w.colorSpace,w.isVideoTexture);ht(Z,w);let ct;const It=w.mipmaps,Tt=w.isVideoTexture!==!0,re=vt.__version===void 0||tt===!0,y=J.dataReady,q=E(w,nt);if(w.isDepthTexture)Et=x(w.format===ys,w.type),re&&(Tt?e.texStorage2D(i.TEXTURE_2D,1,Et,nt.width,nt.height):e.texImage2D(i.TEXTURE_2D,0,Et,nt.width,nt.height,0,mt,kt,null));else if(w.isDataTexture)if(It.length>0){Tt&&re&&e.texStorage2D(i.TEXTURE_2D,q,Et,It[0].width,It[0].height);for(let G=0,j=It.length;G<j;G++)ct=It[G],Tt?y&&e.texSubImage2D(i.TEXTURE_2D,G,0,0,ct.width,ct.height,mt,kt,ct.data):e.texImage2D(i.TEXTURE_2D,G,Et,ct.width,ct.height,0,mt,kt,ct.data);w.generateMipmaps=!1}else Tt?(re&&e.texStorage2D(i.TEXTURE_2D,q,Et,nt.width,nt.height),y&&e.texSubImage2D(i.TEXTURE_2D,0,0,0,nt.width,nt.height,mt,kt,nt.data)):e.texImage2D(i.TEXTURE_2D,0,Et,nt.width,nt.height,0,mt,kt,nt.data);else if(w.isCompressedTexture)if(w.isCompressedArrayTexture){Tt&&re&&e.texStorage3D(i.TEXTURE_2D_ARRAY,q,Et,It[0].width,It[0].height,nt.depth);for(let G=0,j=It.length;G<j;G++)if(ct=It[G],w.format!==bn)if(mt!==null)if(Tt){if(y)if(w.layerUpdates.size>0){for(const Q of w.layerUpdates){const Mt=ct.width*ct.height;e.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY,G,0,0,Q,ct.width,ct.height,1,mt,ct.data.slice(Mt*Q,Mt*(Q+1)),0,0)}w.clearLayerUpdates()}else e.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY,G,0,0,0,ct.width,ct.height,nt.depth,mt,ct.data,0,0)}else e.compressedTexImage3D(i.TEXTURE_2D_ARRAY,G,Et,ct.width,ct.height,nt.depth,0,ct.data,0,0);else console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else Tt?y&&e.texSubImage3D(i.TEXTURE_2D_ARRAY,G,0,0,0,ct.width,ct.height,nt.depth,mt,kt,ct.data):e.texImage3D(i.TEXTURE_2D_ARRAY,G,Et,ct.width,ct.height,nt.depth,0,mt,kt,ct.data)}else{Tt&&re&&e.texStorage2D(i.TEXTURE_2D,q,Et,It[0].width,It[0].height);for(let G=0,j=It.length;G<j;G++)ct=It[G],w.format!==bn?mt!==null?Tt?y&&e.compressedTexSubImage2D(i.TEXTURE_2D,G,0,0,ct.width,ct.height,mt,ct.data):e.compressedTexImage2D(i.TEXTURE_2D,G,Et,ct.width,ct.height,0,ct.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):Tt?y&&e.texSubImage2D(i.TEXTURE_2D,G,0,0,ct.width,ct.height,mt,kt,ct.data):e.texImage2D(i.TEXTURE_2D,G,Et,ct.width,ct.height,0,mt,kt,ct.data)}else if(w.isDataArrayTexture)if(Tt){if(re&&e.texStorage3D(i.TEXTURE_2D_ARRAY,q,Et,nt.width,nt.height,nt.depth),y)if(w.layerUpdates.size>0){let G;switch(kt){case i.UNSIGNED_BYTE:switch(mt){case i.ALPHA:G=1;break;case i.LUMINANCE:G=1;break;case i.LUMINANCE_ALPHA:G=2;break;case i.RGB:G=3;break;case i.RGBA:G=4;break;default:throw new Error(`Unknown texel size for format ${mt}.`)}break;case i.UNSIGNED_SHORT_4_4_4_4:case i.UNSIGNED_SHORT_5_5_5_1:case i.UNSIGNED_SHORT_5_6_5:G=1;break;default:throw new Error(`Unknown texel size for type ${kt}.`)}const j=nt.width*nt.height*G;for(const Q of w.layerUpdates)e.texSubImage3D(i.TEXTURE_2D_ARRAY,0,0,0,Q,nt.width,nt.height,1,mt,kt,nt.data.slice(j*Q,j*(Q+1)));w.clearLayerUpdates()}else e.texSubImage3D(i.TEXTURE_2D_ARRAY,0,0,0,0,nt.width,nt.height,nt.depth,mt,kt,nt.data)}else e.texImage3D(i.TEXTURE_2D_ARRAY,0,Et,nt.width,nt.height,nt.depth,0,mt,kt,nt.data);else if(w.isData3DTexture)Tt?(re&&e.texStorage3D(i.TEXTURE_3D,q,Et,nt.width,nt.height,nt.depth),y&&e.texSubImage3D(i.TEXTURE_3D,0,0,0,0,nt.width,nt.height,nt.depth,mt,kt,nt.data)):e.texImage3D(i.TEXTURE_3D,0,Et,nt.width,nt.height,nt.depth,0,mt,kt,nt.data);else if(w.isFramebufferTexture){if(re)if(Tt)e.texStorage2D(i.TEXTURE_2D,q,Et,nt.width,nt.height);else{let G=nt.width,j=nt.height;for(let Q=0;Q<q;Q++)e.texImage2D(i.TEXTURE_2D,Q,Et,G,j,0,mt,kt,null),G>>=1,j>>=1}}else if(It.length>0){if(Tt&&re){const G=$t(It[0]);e.texStorage2D(i.TEXTURE_2D,q,Et,G.width,G.height)}for(let G=0,j=It.length;G<j;G++)ct=It[G],Tt?y&&e.texSubImage2D(i.TEXTURE_2D,G,0,0,mt,kt,ct):e.texImage2D(i.TEXTURE_2D,G,Et,mt,kt,ct);w.generateMipmaps=!1}else if(Tt){if(re){const G=$t(nt);e.texStorage2D(i.TEXTURE_2D,q,Et,G.width,G.height)}y&&e.texSubImage2D(i.TEXTURE_2D,0,0,0,mt,kt,nt)}else e.texImage2D(i.TEXTURE_2D,0,Et,mt,kt,nt);m(w)&&p(Z),vt.__version=J.version,w.onUpdate&&w.onUpdate(w)}U.__version=w.version}function K(U,w,X){if(w.image.length!==6)return;const Z=Pt(U,w),tt=w.source;e.bindTexture(i.TEXTURE_CUBE_MAP,U.__webglTexture,i.TEXTURE0+X);const J=n.get(tt);if(tt.version!==J.__version||Z===!0){e.activeTexture(i.TEXTURE0+X);const vt=ne.getPrimaries(ne.workingColorSpace),ot=w.colorSpace===ti?null:ne.getPrimaries(w.colorSpace),at=w.colorSpace===ti||vt===ot?i.NONE:i.BROWSER_DEFAULT_WEBGL;i.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,w.flipY),i.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,w.premultiplyAlpha),i.pixelStorei(i.UNPACK_ALIGNMENT,w.unpackAlignment),i.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,at);const Ut=w.isCompressedTexture||w.image[0].isCompressedTexture,nt=w.image[0]&&w.image[0].isDataTexture,mt=[];for(let j=0;j<6;j++)!Ut&&!nt?mt[j]=_(w.image[j],!0,s.maxCubemapSize):mt[j]=nt?w.image[j].image:w.image[j],mt[j]=wt(w,mt[j]);const kt=mt[0],Et=r.convert(w.format,w.colorSpace),ct=r.convert(w.type),It=M(w.internalFormat,Et,ct,w.colorSpace),Tt=w.isVideoTexture!==!0,re=J.__version===void 0||Z===!0,y=tt.dataReady;let q=E(w,kt);ht(i.TEXTURE_CUBE_MAP,w);let G;if(Ut){Tt&&re&&e.texStorage2D(i.TEXTURE_CUBE_MAP,q,It,kt.width,kt.height);for(let j=0;j<6;j++){G=mt[j].mipmaps;for(let Q=0;Q<G.length;Q++){const Mt=G[Q];w.format!==bn?Et!==null?Tt?y&&e.compressedTexSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+j,Q,0,0,Mt.width,Mt.height,Et,Mt.data):e.compressedTexImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+j,Q,It,Mt.width,Mt.height,0,Mt.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):Tt?y&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+j,Q,0,0,Mt.width,Mt.height,Et,ct,Mt.data):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+j,Q,It,Mt.width,Mt.height,0,Et,ct,Mt.data)}}}else{if(G=w.mipmaps,Tt&&re){G.length>0&&q++;const j=$t(mt[0]);e.texStorage2D(i.TEXTURE_CUBE_MAP,q,It,j.width,j.height)}for(let j=0;j<6;j++)if(nt){Tt?y&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+j,0,0,0,mt[j].width,mt[j].height,Et,ct,mt[j].data):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+j,0,It,mt[j].width,mt[j].height,0,Et,ct,mt[j].data);for(let Q=0;Q<G.length;Q++){const St=G[Q].image[j].image;Tt?y&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+j,Q+1,0,0,St.width,St.height,Et,ct,St.data):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+j,Q+1,It,St.width,St.height,0,Et,ct,St.data)}}else{Tt?y&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+j,0,0,0,Et,ct,mt[j]):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+j,0,It,Et,ct,mt[j]);for(let Q=0;Q<G.length;Q++){const Mt=G[Q];Tt?y&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+j,Q+1,0,0,Et,ct,Mt.image[j]):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+j,Q+1,It,Et,ct,Mt.image[j])}}}m(w)&&p(i.TEXTURE_CUBE_MAP),J.__version=tt.version,w.onUpdate&&w.onUpdate(w)}U.__version=w.version}function et(U,w,X,Z,tt,J){const vt=r.convert(X.format,X.colorSpace),ot=r.convert(X.type),at=M(X.internalFormat,vt,ot,X.colorSpace);if(!n.get(w).__hasExternalTextures){const nt=Math.max(1,w.width>>J),mt=Math.max(1,w.height>>J);tt===i.TEXTURE_3D||tt===i.TEXTURE_2D_ARRAY?e.texImage3D(tt,J,at,nt,mt,w.depth,0,vt,ot,null):e.texImage2D(tt,J,at,nt,mt,0,vt,ot,null)}e.bindFramebuffer(i.FRAMEBUFFER,U),Ht(w)?a.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,Z,tt,n.get(X).__webglTexture,0,_t(w)):(tt===i.TEXTURE_2D||tt>=i.TEXTURE_CUBE_MAP_POSITIVE_X&&tt<=i.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&i.framebufferTexture2D(i.FRAMEBUFFER,Z,tt,n.get(X).__webglTexture,J),e.bindFramebuffer(i.FRAMEBUFFER,null)}function pt(U,w,X){if(i.bindRenderbuffer(i.RENDERBUFFER,U),w.depthBuffer){const Z=w.depthTexture,tt=Z&&Z.isDepthTexture?Z.type:null,J=x(w.stencilBuffer,tt),vt=w.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,ot=_t(w);Ht(w)?a.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,ot,J,w.width,w.height):X?i.renderbufferStorageMultisample(i.RENDERBUFFER,ot,J,w.width,w.height):i.renderbufferStorage(i.RENDERBUFFER,J,w.width,w.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,vt,i.RENDERBUFFER,U)}else{const Z=w.textures;for(let tt=0;tt<Z.length;tt++){const J=Z[tt],vt=r.convert(J.format,J.colorSpace),ot=r.convert(J.type),at=M(J.internalFormat,vt,ot,J.colorSpace),Ut=_t(w);X&&Ht(w)===!1?i.renderbufferStorageMultisample(i.RENDERBUFFER,Ut,at,w.width,w.height):Ht(w)?a.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,Ut,at,w.width,w.height):i.renderbufferStorage(i.RENDERBUFFER,at,w.width,w.height)}}i.bindRenderbuffer(i.RENDERBUFFER,null)}function lt(U,w){if(w&&w.isWebGLCubeRenderTarget)throw new Error("Depth Texture with cube render targets is not supported");if(e.bindFramebuffer(i.FRAMEBUFFER,U),!(w.depthTexture&&w.depthTexture.isDepthTexture))throw new Error("renderTarget.depthTexture must be an instance of THREE.DepthTexture");(!n.get(w.depthTexture).__webglTexture||w.depthTexture.image.width!==w.width||w.depthTexture.image.height!==w.height)&&(w.depthTexture.image.width=w.width,w.depthTexture.image.height=w.height,w.depthTexture.needsUpdate=!0),N(w.depthTexture,0);const Z=n.get(w.depthTexture).__webglTexture,tt=_t(w);if(w.depthTexture.format===gs)Ht(w)?a.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,i.DEPTH_ATTACHMENT,i.TEXTURE_2D,Z,0,tt):i.framebufferTexture2D(i.FRAMEBUFFER,i.DEPTH_ATTACHMENT,i.TEXTURE_2D,Z,0);else if(w.depthTexture.format===ys)Ht(w)?a.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,i.DEPTH_STENCIL_ATTACHMENT,i.TEXTURE_2D,Z,0,tt):i.framebufferTexture2D(i.FRAMEBUFFER,i.DEPTH_STENCIL_ATTACHMENT,i.TEXTURE_2D,Z,0);else throw new Error("Unknown depthTexture format")}function Ot(U){const w=n.get(U),X=U.isWebGLCubeRenderTarget===!0;if(U.depthTexture&&!w.__autoAllocateDepthBuffer){if(X)throw new Error("target.depthTexture not supported in Cube render targets");lt(w.__webglFramebuffer,U)}else if(X){w.__webglDepthbuffer=[];for(let Z=0;Z<6;Z++)e.bindFramebuffer(i.FRAMEBUFFER,w.__webglFramebuffer[Z]),w.__webglDepthbuffer[Z]=i.createRenderbuffer(),pt(w.__webglDepthbuffer[Z],U,!1)}else e.bindFramebuffer(i.FRAMEBUFFER,w.__webglFramebuffer),w.__webglDepthbuffer=i.createRenderbuffer(),pt(w.__webglDepthbuffer,U,!1);e.bindFramebuffer(i.FRAMEBUFFER,null)}function Rt(U,w,X){const Z=n.get(U);w!==void 0&&et(Z.__webglFramebuffer,U,U.texture,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,0),X!==void 0&&Ot(U)}function Xt(U){const w=U.texture,X=n.get(U),Z=n.get(w);U.addEventListener("dispose",b);const tt=U.textures,J=U.isWebGLCubeRenderTarget===!0,vt=tt.length>1;if(vt||(Z.__webglTexture===void 0&&(Z.__webglTexture=i.createTexture()),Z.__version=w.version,o.memory.textures++),J){X.__webglFramebuffer=[];for(let ot=0;ot<6;ot++)if(w.mipmaps&&w.mipmaps.length>0){X.__webglFramebuffer[ot]=[];for(let at=0;at<w.mipmaps.length;at++)X.__webglFramebuffer[ot][at]=i.createFramebuffer()}else X.__webglFramebuffer[ot]=i.createFramebuffer()}else{if(w.mipmaps&&w.mipmaps.length>0){X.__webglFramebuffer=[];for(let ot=0;ot<w.mipmaps.length;ot++)X.__webglFramebuffer[ot]=i.createFramebuffer()}else X.__webglFramebuffer=i.createFramebuffer();if(vt)for(let ot=0,at=tt.length;ot<at;ot++){const Ut=n.get(tt[ot]);Ut.__webglTexture===void 0&&(Ut.__webglTexture=i.createTexture(),o.memory.textures++)}if(U.samples>0&&Ht(U)===!1){X.__webglMultisampledFramebuffer=i.createFramebuffer(),X.__webglColorRenderbuffer=[],e.bindFramebuffer(i.FRAMEBUFFER,X.__webglMultisampledFramebuffer);for(let ot=0;ot<tt.length;ot++){const at=tt[ot];X.__webglColorRenderbuffer[ot]=i.createRenderbuffer(),i.bindRenderbuffer(i.RENDERBUFFER,X.__webglColorRenderbuffer[ot]);const Ut=r.convert(at.format,at.colorSpace),nt=r.convert(at.type),mt=M(at.internalFormat,Ut,nt,at.colorSpace,U.isXRRenderTarget===!0),kt=_t(U);i.renderbufferStorageMultisample(i.RENDERBUFFER,kt,mt,U.width,U.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+ot,i.RENDERBUFFER,X.__webglColorRenderbuffer[ot])}i.bindRenderbuffer(i.RENDERBUFFER,null),U.depthBuffer&&(X.__webglDepthRenderbuffer=i.createRenderbuffer(),pt(X.__webglDepthRenderbuffer,U,!0)),e.bindFramebuffer(i.FRAMEBUFFER,null)}}if(J){e.bindTexture(i.TEXTURE_CUBE_MAP,Z.__webglTexture),ht(i.TEXTURE_CUBE_MAP,w);for(let ot=0;ot<6;ot++)if(w.mipmaps&&w.mipmaps.length>0)for(let at=0;at<w.mipmaps.length;at++)et(X.__webglFramebuffer[ot][at],U,w,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+ot,at);else et(X.__webglFramebuffer[ot],U,w,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+ot,0);m(w)&&p(i.TEXTURE_CUBE_MAP),e.unbindTexture()}else if(vt){for(let ot=0,at=tt.length;ot<at;ot++){const Ut=tt[ot],nt=n.get(Ut);e.bindTexture(i.TEXTURE_2D,nt.__webglTexture),ht(i.TEXTURE_2D,Ut),et(X.__webglFramebuffer,U,Ut,i.COLOR_ATTACHMENT0+ot,i.TEXTURE_2D,0),m(Ut)&&p(i.TEXTURE_2D)}e.unbindTexture()}else{let ot=i.TEXTURE_2D;if((U.isWebGL3DRenderTarget||U.isWebGLArrayRenderTarget)&&(ot=U.isWebGL3DRenderTarget?i.TEXTURE_3D:i.TEXTURE_2D_ARRAY),e.bindTexture(ot,Z.__webglTexture),ht(ot,w),w.mipmaps&&w.mipmaps.length>0)for(let at=0;at<w.mipmaps.length;at++)et(X.__webglFramebuffer[at],U,w,i.COLOR_ATTACHMENT0,ot,at);else et(X.__webglFramebuffer,U,w,i.COLOR_ATTACHMENT0,ot,0);m(w)&&p(ot),e.unbindTexture()}U.depthBuffer&&Ot(U)}function F(U){const w=U.textures;for(let X=0,Z=w.length;X<Z;X++){const tt=w[X];if(m(tt)){const J=U.isWebGLCubeRenderTarget?i.TEXTURE_CUBE_MAP:i.TEXTURE_2D,vt=n.get(tt).__webglTexture;e.bindTexture(J,vt),p(J),e.unbindTexture()}}}const qt=[],zt=[];function Qt(U){if(U.samples>0){if(Ht(U)===!1){const w=U.textures,X=U.width,Z=U.height;let tt=i.COLOR_BUFFER_BIT;const J=U.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,vt=n.get(U),ot=w.length>1;if(ot)for(let at=0;at<w.length;at++)e.bindFramebuffer(i.FRAMEBUFFER,vt.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+at,i.RENDERBUFFER,null),e.bindFramebuffer(i.FRAMEBUFFER,vt.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+at,i.TEXTURE_2D,null,0);e.bindFramebuffer(i.READ_FRAMEBUFFER,vt.__webglMultisampledFramebuffer),e.bindFramebuffer(i.DRAW_FRAMEBUFFER,vt.__webglFramebuffer);for(let at=0;at<w.length;at++){if(U.resolveDepthBuffer&&(U.depthBuffer&&(tt|=i.DEPTH_BUFFER_BIT),U.stencilBuffer&&U.resolveStencilBuffer&&(tt|=i.STENCIL_BUFFER_BIT)),ot){i.framebufferRenderbuffer(i.READ_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.RENDERBUFFER,vt.__webglColorRenderbuffer[at]);const Ut=n.get(w[at]).__webglTexture;i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,Ut,0)}i.blitFramebuffer(0,0,X,Z,0,0,X,Z,tt,i.NEAREST),l===!0&&(qt.length=0,zt.length=0,qt.push(i.COLOR_ATTACHMENT0+at),U.depthBuffer&&U.resolveDepthBuffer===!1&&(qt.push(J),zt.push(J),i.invalidateFramebuffer(i.DRAW_FRAMEBUFFER,zt)),i.invalidateFramebuffer(i.READ_FRAMEBUFFER,qt))}if(e.bindFramebuffer(i.READ_FRAMEBUFFER,null),e.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),ot)for(let at=0;at<w.length;at++){e.bindFramebuffer(i.FRAMEBUFFER,vt.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+at,i.RENDERBUFFER,vt.__webglColorRenderbuffer[at]);const Ut=n.get(w[at]).__webglTexture;e.bindFramebuffer(i.FRAMEBUFFER,vt.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+at,i.TEXTURE_2D,Ut,0)}e.bindFramebuffer(i.DRAW_FRAMEBUFFER,vt.__webglMultisampledFramebuffer)}else if(U.depthBuffer&&U.resolveDepthBuffer===!1&&l){const w=U.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT;i.invalidateFramebuffer(i.DRAW_FRAMEBUFFER,[w])}}}function _t(U){return Math.min(s.maxSamples,U.samples)}function Ht(U){const w=n.get(U);return U.samples>0&&t.has("WEBGL_multisampled_render_to_texture")===!0&&w.__useRenderToTexture!==!1}function Bt(U){const w=o.render.frame;h.get(U)!==w&&(h.set(U,w),U.update())}function wt(U,w){const X=U.colorSpace,Z=U.format,tt=U.type;return U.isCompressedTexture===!0||U.isVideoTexture===!0||X!==hi&&X!==ti&&(ne.getTransfer(X)===oe?(Z!==bn||tt!==li)&&console.warn("THREE.WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):console.error("THREE.WebGLTextures: Unsupported texture color space:",X)),w}function $t(U){return typeof HTMLImageElement<"u"&&U instanceof HTMLImageElement?(c.width=U.naturalWidth||U.width,c.height=U.naturalHeight||U.height):typeof VideoFrame<"u"&&U instanceof VideoFrame?(c.width=U.displayWidth,c.height=U.displayHeight):(c.width=U.width,c.height=U.height),c}this.allocateTextureUnit=L,this.resetTextureUnits=R,this.setTexture2D=N,this.setTexture2DArray=z,this.setTexture3D=O,this.setTextureCube=Y,this.rebindTextures=Rt,this.setupRenderTarget=Xt,this.updateRenderTargetMipmap=F,this.updateMultisampleRenderTarget=Qt,this.setupDepthRenderbuffer=Ot,this.setupFrameBufferTexture=et,this.useMultisampledRTT=Ht}function w_(i,t){function e(n,s=ti){let r;const o=ne.getTransfer(s);if(n===li)return i.UNSIGNED_BYTE;if(n===Mu)return i.UNSIGNED_SHORT_4_4_4_4;if(n===Su)return i.UNSIGNED_SHORT_5_5_5_1;if(n===cf)return i.UNSIGNED_INT_5_9_9_9_REV;if(n===af)return i.BYTE;if(n===lf)return i.SHORT;if(n===Qr)return i.UNSIGNED_SHORT;if(n===vu)return i.INT;if(n===Ms)return i.UNSIGNED_INT;if(n===ni)return i.FLOAT;if(n===ho)return i.HALF_FLOAT;if(n===uf)return i.ALPHA;if(n===hf)return i.RGB;if(n===bn)return i.RGBA;if(n===ff)return i.LUMINANCE;if(n===df)return i.LUMINANCE_ALPHA;if(n===gs)return i.DEPTH_COMPONENT;if(n===ys)return i.DEPTH_STENCIL;if(n===pf)return i.RED;if(n===yu)return i.RED_INTEGER;if(n===mf)return i.RG;if(n===Eu)return i.RG_INTEGER;if(n===Tu)return i.RGBA_INTEGER;if(n===Eo||n===To||n===bo||n===Ao)if(o===oe)if(r=t.get("WEBGL_compressed_texture_s3tc_srgb"),r!==null){if(n===Eo)return r.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(n===To)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(n===bo)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(n===Ao)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(r=t.get("WEBGL_compressed_texture_s3tc"),r!==null){if(n===Eo)return r.COMPRESSED_RGB_S3TC_DXT1_EXT;if(n===To)return r.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(n===bo)return r.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(n===Ao)return r.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(n===il||n===sl||n===rl||n===ol)if(r=t.get("WEBGL_compressed_texture_pvrtc"),r!==null){if(n===il)return r.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(n===sl)return r.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(n===rl)return r.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(n===ol)return r.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(n===al||n===ll||n===cl)if(r=t.get("WEBGL_compressed_texture_etc"),r!==null){if(n===al||n===ll)return o===oe?r.COMPRESSED_SRGB8_ETC2:r.COMPRESSED_RGB8_ETC2;if(n===cl)return o===oe?r.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:r.COMPRESSED_RGBA8_ETC2_EAC}else return null;if(n===ul||n===hl||n===fl||n===dl||n===pl||n===ml||n===gl||n===_l||n===xl||n===vl||n===Ml||n===Sl||n===yl||n===El)if(r=t.get("WEBGL_compressed_texture_astc"),r!==null){if(n===ul)return o===oe?r.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:r.COMPRESSED_RGBA_ASTC_4x4_KHR;if(n===hl)return o===oe?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:r.COMPRESSED_RGBA_ASTC_5x4_KHR;if(n===fl)return o===oe?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:r.COMPRESSED_RGBA_ASTC_5x5_KHR;if(n===dl)return o===oe?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:r.COMPRESSED_RGBA_ASTC_6x5_KHR;if(n===pl)return o===oe?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:r.COMPRESSED_RGBA_ASTC_6x6_KHR;if(n===ml)return o===oe?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:r.COMPRESSED_RGBA_ASTC_8x5_KHR;if(n===gl)return o===oe?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:r.COMPRESSED_RGBA_ASTC_8x6_KHR;if(n===_l)return o===oe?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:r.COMPRESSED_RGBA_ASTC_8x8_KHR;if(n===xl)return o===oe?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:r.COMPRESSED_RGBA_ASTC_10x5_KHR;if(n===vl)return o===oe?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:r.COMPRESSED_RGBA_ASTC_10x6_KHR;if(n===Ml)return o===oe?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:r.COMPRESSED_RGBA_ASTC_10x8_KHR;if(n===Sl)return o===oe?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:r.COMPRESSED_RGBA_ASTC_10x10_KHR;if(n===yl)return o===oe?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:r.COMPRESSED_RGBA_ASTC_12x10_KHR;if(n===El)return o===oe?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:r.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(n===wo||n===Tl||n===bl)if(r=t.get("EXT_texture_compression_bptc"),r!==null){if(n===wo)return o===oe?r.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:r.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(n===Tl)return r.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(n===bl)return r.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(n===gf||n===Al||n===wl||n===Rl)if(r=t.get("EXT_texture_compression_rgtc"),r!==null){if(n===wo)return r.COMPRESSED_RED_RGTC1_EXT;if(n===Al)return r.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(n===wl)return r.COMPRESSED_RED_GREEN_RGTC2_EXT;if(n===Rl)return r.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return n===Ss?i.UNSIGNED_INT_24_8:i[n]!==void 0?i[n]:null}return{convert:e}}class R_ extends sn{constructor(t=[]){super(),this.isArrayCamera=!0,this.cameras=t}}class ii extends Ae{constructor(){super(),this.isGroup=!0,this.type="Group"}}const C_={type:"move"};class Qo{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new ii,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new ii,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new I,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new I),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new ii,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new I,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new I),this._grip}dispatchEvent(t){return this._targetRay!==null&&this._targetRay.dispatchEvent(t),this._grip!==null&&this._grip.dispatchEvent(t),this._hand!==null&&this._hand.dispatchEvent(t),this}connect(t){if(t&&t.hand){const e=this._hand;if(e)for(const n of t.hand.values())this._getHandJoint(e,n)}return this.dispatchEvent({type:"connected",data:t}),this}disconnect(t){return this.dispatchEvent({type:"disconnected",data:t}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(t,e,n){let s=null,r=null,o=null;const a=this._targetRay,l=this._grip,c=this._hand;if(t&&e.session.visibilityState!=="visible-blurred"){if(c&&t.hand){o=!0;for(const _ of t.hand.values()){const m=e.getJointPose(_,n),p=this._getHandJoint(c,_);m!==null&&(p.matrix.fromArray(m.transform.matrix),p.matrix.decompose(p.position,p.rotation,p.scale),p.matrixWorldNeedsUpdate=!0,p.jointRadius=m.radius),p.visible=m!==null}const h=c.joints["index-finger-tip"],f=c.joints["thumb-tip"],u=h.position.distanceTo(f.position),d=.02,g=.005;c.inputState.pinching&&u>d+g?(c.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:t.handedness,target:this})):!c.inputState.pinching&&u<=d-g&&(c.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:t.handedness,target:this}))}else l!==null&&t.gripSpace&&(r=e.getPose(t.gripSpace,n),r!==null&&(l.matrix.fromArray(r.transform.matrix),l.matrix.decompose(l.position,l.rotation,l.scale),l.matrixWorldNeedsUpdate=!0,r.linearVelocity?(l.hasLinearVelocity=!0,l.linearVelocity.copy(r.linearVelocity)):l.hasLinearVelocity=!1,r.angularVelocity?(l.hasAngularVelocity=!0,l.angularVelocity.copy(r.angularVelocity)):l.hasAngularVelocity=!1));a!==null&&(s=e.getPose(t.targetRaySpace,n),s===null&&r!==null&&(s=r),s!==null&&(a.matrix.fromArray(s.transform.matrix),a.matrix.decompose(a.position,a.rotation,a.scale),a.matrixWorldNeedsUpdate=!0,s.linearVelocity?(a.hasLinearVelocity=!0,a.linearVelocity.copy(s.linearVelocity)):a.hasLinearVelocity=!1,s.angularVelocity?(a.hasAngularVelocity=!0,a.angularVelocity.copy(s.angularVelocity)):a.hasAngularVelocity=!1,this.dispatchEvent(C_)))}return a!==null&&(a.visible=s!==null),l!==null&&(l.visible=r!==null),c!==null&&(c.visible=o!==null),this}_getHandJoint(t,e){if(t.joints[e.jointName]===void 0){const n=new ii;n.matrixAutoUpdate=!1,n.visible=!1,t.joints[e.jointName]=n,t.add(n)}return t.joints[e.jointName]}}const P_=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,L_=`
uniform sampler2DArray depthColor;
uniform float depthWidth;
uniform float depthHeight;

void main() {

	vec2 coord = vec2( gl_FragCoord.x / depthWidth, gl_FragCoord.y / depthHeight );

	if ( coord.x >= 1.0 ) {

		gl_FragDepth = texture( depthColor, vec3( coord.x - 1.0, coord.y, 1 ) ).r;

	} else {

		gl_FragDepth = texture( depthColor, vec3( coord.x, coord.y, 0 ) ).r;

	}

}`;class D_{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(t,e,n){if(this.texture===null){const s=new Ge,r=t.properties.get(s);r.__webglTexture=e.texture,(e.depthNear!=n.depthNear||e.depthFar!=n.depthFar)&&(this.depthNear=e.depthNear,this.depthFar=e.depthFar),this.texture=s}}getMesh(t){if(this.texture!==null&&this.mesh===null){const e=t.cameras[0].viewport,n=new ci({vertexShader:P_,fragmentShader:L_,uniforms:{depthColor:{value:this.texture},depthWidth:{value:e.z},depthHeight:{value:e.w}}});this.mesh=new me(new Qs(20,20),n)}return this.mesh}reset(){this.texture=null,this.mesh=null}}class U_ extends Di{constructor(t,e){super();const n=this;let s=null,r=1,o=null,a="local-floor",l=1,c=null,h=null,f=null,u=null,d=null,g=null;const _=new D_,m=e.getContextAttributes();let p=null,M=null;const x=[],E=[],A=new At;let b=null;const S=new sn;S.layers.enable(1),S.viewport=new Ee;const P=new sn;P.layers.enable(2),P.viewport=new Ee;const T=[S,P],v=new R_;v.layers.enable(1),v.layers.enable(2);let R=null,L=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(K){let et=x[K];return et===void 0&&(et=new Qo,x[K]=et),et.getTargetRaySpace()},this.getControllerGrip=function(K){let et=x[K];return et===void 0&&(et=new Qo,x[K]=et),et.getGripSpace()},this.getHand=function(K){let et=x[K];return et===void 0&&(et=new Qo,x[K]=et),et.getHandSpace()};function D(K){const et=E.indexOf(K.inputSource);if(et===-1)return;const pt=x[et];pt!==void 0&&(pt.update(K.inputSource,K.frame,c||o),pt.dispatchEvent({type:K.type,data:K.inputSource}))}function N(){s.removeEventListener("select",D),s.removeEventListener("selectstart",D),s.removeEventListener("selectend",D),s.removeEventListener("squeeze",D),s.removeEventListener("squeezestart",D),s.removeEventListener("squeezeend",D),s.removeEventListener("end",N),s.removeEventListener("inputsourceschange",z);for(let K=0;K<x.length;K++){const et=E[K];et!==null&&(E[K]=null,x[K].disconnect(et))}R=null,L=null,_.reset(),t.setRenderTarget(p),d=null,u=null,f=null,s=null,M=null,Wt.stop(),n.isPresenting=!1,t.setPixelRatio(b),t.setSize(A.width,A.height,!1),n.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(K){r=K,n.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(K){a=K,n.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return c||o},this.setReferenceSpace=function(K){c=K},this.getBaseLayer=function(){return u!==null?u:d},this.getBinding=function(){return f},this.getFrame=function(){return g},this.getSession=function(){return s},this.setSession=async function(K){if(s=K,s!==null){if(p=t.getRenderTarget(),s.addEventListener("select",D),s.addEventListener("selectstart",D),s.addEventListener("selectend",D),s.addEventListener("squeeze",D),s.addEventListener("squeezestart",D),s.addEventListener("squeezeend",D),s.addEventListener("end",N),s.addEventListener("inputsourceschange",z),m.xrCompatible!==!0&&await e.makeXRCompatible(),b=t.getPixelRatio(),t.getSize(A),s.renderState.layers===void 0){const et={antialias:m.antialias,alpha:!0,depth:m.depth,stencil:m.stencil,framebufferScaleFactor:r};d=new XRWebGLLayer(s,e,et),s.updateRenderState({baseLayer:d}),t.setPixelRatio(1),t.setSize(d.framebufferWidth,d.framebufferHeight,!1),M=new Ri(d.framebufferWidth,d.framebufferHeight,{format:bn,type:li,colorSpace:t.outputColorSpace,stencilBuffer:m.stencil})}else{let et=null,pt=null,lt=null;m.depth&&(lt=m.stencil?e.DEPTH24_STENCIL8:e.DEPTH_COMPONENT24,et=m.stencil?ys:gs,pt=m.stencil?Ss:Ms);const Ot={colorFormat:e.RGBA8,depthFormat:lt,scaleFactor:r};f=new XRWebGLBinding(s,e),u=f.createProjectionLayer(Ot),s.updateRenderState({layers:[u]}),t.setPixelRatio(1),t.setSize(u.textureWidth,u.textureHeight,!1),M=new Ri(u.textureWidth,u.textureHeight,{format:bn,type:li,depthTexture:new ku(u.textureWidth,u.textureHeight,pt,void 0,void 0,void 0,void 0,void 0,void 0,et),stencilBuffer:m.stencil,colorSpace:t.outputColorSpace,samples:m.antialias?4:0,resolveDepthBuffer:u.ignoreDepthValues===!1})}M.isXRRenderTarget=!0,this.setFoveation(l),c=null,o=await s.requestReferenceSpace(a),Wt.setContext(s),Wt.start(),n.isPresenting=!0,n.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(s!==null)return s.environmentBlendMode};function z(K){for(let et=0;et<K.removed.length;et++){const pt=K.removed[et],lt=E.indexOf(pt);lt>=0&&(E[lt]=null,x[lt].disconnect(pt))}for(let et=0;et<K.added.length;et++){const pt=K.added[et];let lt=E.indexOf(pt);if(lt===-1){for(let Rt=0;Rt<x.length;Rt++)if(Rt>=E.length){E.push(pt),lt=Rt;break}else if(E[Rt]===null){E[Rt]=pt,lt=Rt;break}if(lt===-1)break}const Ot=x[lt];Ot&&Ot.connect(pt)}}const O=new I,Y=new I;function B(K,et,pt){O.setFromMatrixPosition(et.matrixWorld),Y.setFromMatrixPosition(pt.matrixWorld);const lt=O.distanceTo(Y),Ot=et.projectionMatrix.elements,Rt=pt.projectionMatrix.elements,Xt=Ot[14]/(Ot[10]-1),F=Ot[14]/(Ot[10]+1),qt=(Ot[9]+1)/Ot[5],zt=(Ot[9]-1)/Ot[5],Qt=(Ot[8]-1)/Ot[0],_t=(Rt[8]+1)/Rt[0],Ht=Xt*Qt,Bt=Xt*_t,wt=lt/(-Qt+_t),$t=wt*-Qt;et.matrixWorld.decompose(K.position,K.quaternion,K.scale),K.translateX($t),K.translateZ(wt),K.matrixWorld.compose(K.position,K.quaternion,K.scale),K.matrixWorldInverse.copy(K.matrixWorld).invert();const U=Xt+wt,w=F+wt,X=Ht-$t,Z=Bt+(lt-$t),tt=qt*F/w*U,J=zt*F/w*U;K.projectionMatrix.makePerspective(X,Z,tt,J,U,w),K.projectionMatrixInverse.copy(K.projectionMatrix).invert()}function it(K,et){et===null?K.matrixWorld.copy(K.matrix):K.matrixWorld.multiplyMatrices(et.matrixWorld,K.matrix),K.matrixWorldInverse.copy(K.matrixWorld).invert()}this.updateCamera=function(K){if(s===null)return;_.texture!==null&&(K.near=_.depthNear,K.far=_.depthFar),v.near=P.near=S.near=K.near,v.far=P.far=S.far=K.far,(R!==v.near||L!==v.far)&&(s.updateRenderState({depthNear:v.near,depthFar:v.far}),R=v.near,L=v.far,S.near=R,S.far=L,P.near=R,P.far=L,S.updateProjectionMatrix(),P.updateProjectionMatrix(),K.updateProjectionMatrix());const et=K.parent,pt=v.cameras;it(v,et);for(let lt=0;lt<pt.length;lt++)it(pt[lt],et);pt.length===2?B(v,S,P):v.projectionMatrix.copy(S.projectionMatrix),st(K,v,et)};function st(K,et,pt){pt===null?K.matrix.copy(et.matrixWorld):(K.matrix.copy(pt.matrixWorld),K.matrix.invert(),K.matrix.multiply(et.matrixWorld)),K.matrix.decompose(K.position,K.quaternion,K.scale),K.updateMatrixWorld(!0),K.projectionMatrix.copy(et.projectionMatrix),K.projectionMatrixInverse.copy(et.projectionMatrixInverse),K.isPerspectiveCamera&&(K.fov=Aa*2*Math.atan(1/K.projectionMatrix.elements[5]),K.zoom=1)}this.getCamera=function(){return v},this.getFoveation=function(){if(!(u===null&&d===null))return l},this.setFoveation=function(K){l=K,u!==null&&(u.fixedFoveation=K),d!==null&&d.fixedFoveation!==void 0&&(d.fixedFoveation=K)},this.hasDepthSensing=function(){return _.texture!==null},this.getDepthSensingMesh=function(){return _.getMesh(v)};let ht=null;function Pt(K,et){if(h=et.getViewerPose(c||o),g=et,h!==null){const pt=h.views;d!==null&&(t.setRenderTargetFramebuffer(M,d.framebuffer),t.setRenderTarget(M));let lt=!1;pt.length!==v.cameras.length&&(v.cameras.length=0,lt=!0);for(let Rt=0;Rt<pt.length;Rt++){const Xt=pt[Rt];let F=null;if(d!==null)F=d.getViewport(Xt);else{const zt=f.getViewSubImage(u,Xt);F=zt.viewport,Rt===0&&(t.setRenderTargetTextures(M,zt.colorTexture,u.ignoreDepthValues?void 0:zt.depthStencilTexture),t.setRenderTarget(M))}let qt=T[Rt];qt===void 0&&(qt=new sn,qt.layers.enable(Rt),qt.viewport=new Ee,T[Rt]=qt),qt.matrix.fromArray(Xt.transform.matrix),qt.matrix.decompose(qt.position,qt.quaternion,qt.scale),qt.projectionMatrix.fromArray(Xt.projectionMatrix),qt.projectionMatrixInverse.copy(qt.projectionMatrix).invert(),qt.viewport.set(F.x,F.y,F.width,F.height),Rt===0&&(v.matrix.copy(qt.matrix),v.matrix.decompose(v.position,v.quaternion,v.scale)),lt===!0&&v.cameras.push(qt)}const Ot=s.enabledFeatures;if(Ot&&Ot.includes("depth-sensing")){const Rt=f.getDepthInformation(pt[0]);Rt&&Rt.isValid&&Rt.texture&&_.init(t,Rt,s.renderState)}}for(let pt=0;pt<x.length;pt++){const lt=E[pt],Ot=x[pt];lt!==null&&Ot!==void 0&&Ot.update(lt,et,c||o)}ht&&ht(K,et),et.detectedPlanes&&n.dispatchEvent({type:"planesdetected",data:et}),g=null}const Wt=new zu;Wt.setAnimationLoop(Pt),this.setAnimationLoop=function(K){ht=K},this.dispose=function(){}}}const Mi=new Rn,I_=new Kt;function N_(i,t){function e(m,p){m.matrixAutoUpdate===!0&&m.updateMatrix(),p.value.copy(m.matrix)}function n(m,p){p.color.getRGB(m.fogColor.value,Nu(i)),p.isFog?(m.fogNear.value=p.near,m.fogFar.value=p.far):p.isFogExp2&&(m.fogDensity.value=p.density)}function s(m,p,M,x,E){p.isMeshBasicMaterial||p.isMeshLambertMaterial?r(m,p):p.isMeshToonMaterial?(r(m,p),f(m,p)):p.isMeshPhongMaterial?(r(m,p),h(m,p)):p.isMeshStandardMaterial?(r(m,p),u(m,p),p.isMeshPhysicalMaterial&&d(m,p,E)):p.isMeshMatcapMaterial?(r(m,p),g(m,p)):p.isMeshDepthMaterial?r(m,p):p.isMeshDistanceMaterial?(r(m,p),_(m,p)):p.isMeshNormalMaterial?r(m,p):p.isLineBasicMaterial?(o(m,p),p.isLineDashedMaterial&&a(m,p)):p.isPointsMaterial?l(m,p,M,x):p.isSpriteMaterial?c(m,p):p.isShadowMaterial?(m.color.value.copy(p.color),m.opacity.value=p.opacity):p.isShaderMaterial&&(p.uniformsNeedUpdate=!1)}function r(m,p){m.opacity.value=p.opacity,p.color&&m.diffuse.value.copy(p.color),p.emissive&&m.emissive.value.copy(p.emissive).multiplyScalar(p.emissiveIntensity),p.map&&(m.map.value=p.map,e(p.map,m.mapTransform)),p.alphaMap&&(m.alphaMap.value=p.alphaMap,e(p.alphaMap,m.alphaMapTransform)),p.bumpMap&&(m.bumpMap.value=p.bumpMap,e(p.bumpMap,m.bumpMapTransform),m.bumpScale.value=p.bumpScale,p.side===Fe&&(m.bumpScale.value*=-1)),p.normalMap&&(m.normalMap.value=p.normalMap,e(p.normalMap,m.normalMapTransform),m.normalScale.value.copy(p.normalScale),p.side===Fe&&m.normalScale.value.negate()),p.displacementMap&&(m.displacementMap.value=p.displacementMap,e(p.displacementMap,m.displacementMapTransform),m.displacementScale.value=p.displacementScale,m.displacementBias.value=p.displacementBias),p.emissiveMap&&(m.emissiveMap.value=p.emissiveMap,e(p.emissiveMap,m.emissiveMapTransform)),p.specularMap&&(m.specularMap.value=p.specularMap,e(p.specularMap,m.specularMapTransform)),p.alphaTest>0&&(m.alphaTest.value=p.alphaTest);const M=t.get(p),x=M.envMap,E=M.envMapRotation;x&&(m.envMap.value=x,Mi.copy(E),Mi.x*=-1,Mi.y*=-1,Mi.z*=-1,x.isCubeTexture&&x.isRenderTargetTexture===!1&&(Mi.y*=-1,Mi.z*=-1),m.envMapRotation.value.setFromMatrix4(I_.makeRotationFromEuler(Mi)),m.flipEnvMap.value=x.isCubeTexture&&x.isRenderTargetTexture===!1?-1:1,m.reflectivity.value=p.reflectivity,m.ior.value=p.ior,m.refractionRatio.value=p.refractionRatio),p.lightMap&&(m.lightMap.value=p.lightMap,m.lightMapIntensity.value=p.lightMapIntensity,e(p.lightMap,m.lightMapTransform)),p.aoMap&&(m.aoMap.value=p.aoMap,m.aoMapIntensity.value=p.aoMapIntensity,e(p.aoMap,m.aoMapTransform))}function o(m,p){m.diffuse.value.copy(p.color),m.opacity.value=p.opacity,p.map&&(m.map.value=p.map,e(p.map,m.mapTransform))}function a(m,p){m.dashSize.value=p.dashSize,m.totalSize.value=p.dashSize+p.gapSize,m.scale.value=p.scale}function l(m,p,M,x){m.diffuse.value.copy(p.color),m.opacity.value=p.opacity,m.size.value=p.size*M,m.scale.value=x*.5,p.map&&(m.map.value=p.map,e(p.map,m.uvTransform)),p.alphaMap&&(m.alphaMap.value=p.alphaMap,e(p.alphaMap,m.alphaMapTransform)),p.alphaTest>0&&(m.alphaTest.value=p.alphaTest)}function c(m,p){m.diffuse.value.copy(p.color),m.opacity.value=p.opacity,m.rotation.value=p.rotation,p.map&&(m.map.value=p.map,e(p.map,m.mapTransform)),p.alphaMap&&(m.alphaMap.value=p.alphaMap,e(p.alphaMap,m.alphaMapTransform)),p.alphaTest>0&&(m.alphaTest.value=p.alphaTest)}function h(m,p){m.specular.value.copy(p.specular),m.shininess.value=Math.max(p.shininess,1e-4)}function f(m,p){p.gradientMap&&(m.gradientMap.value=p.gradientMap)}function u(m,p){m.metalness.value=p.metalness,p.metalnessMap&&(m.metalnessMap.value=p.metalnessMap,e(p.metalnessMap,m.metalnessMapTransform)),m.roughness.value=p.roughness,p.roughnessMap&&(m.roughnessMap.value=p.roughnessMap,e(p.roughnessMap,m.roughnessMapTransform)),p.envMap&&(m.envMapIntensity.value=p.envMapIntensity)}function d(m,p,M){m.ior.value=p.ior,p.sheen>0&&(m.sheenColor.value.copy(p.sheenColor).multiplyScalar(p.sheen),m.sheenRoughness.value=p.sheenRoughness,p.sheenColorMap&&(m.sheenColorMap.value=p.sheenColorMap,e(p.sheenColorMap,m.sheenColorMapTransform)),p.sheenRoughnessMap&&(m.sheenRoughnessMap.value=p.sheenRoughnessMap,e(p.sheenRoughnessMap,m.sheenRoughnessMapTransform))),p.clearcoat>0&&(m.clearcoat.value=p.clearcoat,m.clearcoatRoughness.value=p.clearcoatRoughness,p.clearcoatMap&&(m.clearcoatMap.value=p.clearcoatMap,e(p.clearcoatMap,m.clearcoatMapTransform)),p.clearcoatRoughnessMap&&(m.clearcoatRoughnessMap.value=p.clearcoatRoughnessMap,e(p.clearcoatRoughnessMap,m.clearcoatRoughnessMapTransform)),p.clearcoatNormalMap&&(m.clearcoatNormalMap.value=p.clearcoatNormalMap,e(p.clearcoatNormalMap,m.clearcoatNormalMapTransform),m.clearcoatNormalScale.value.copy(p.clearcoatNormalScale),p.side===Fe&&m.clearcoatNormalScale.value.negate())),p.dispersion>0&&(m.dispersion.value=p.dispersion),p.iridescence>0&&(m.iridescence.value=p.iridescence,m.iridescenceIOR.value=p.iridescenceIOR,m.iridescenceThicknessMinimum.value=p.iridescenceThicknessRange[0],m.iridescenceThicknessMaximum.value=p.iridescenceThicknessRange[1],p.iridescenceMap&&(m.iridescenceMap.value=p.iridescenceMap,e(p.iridescenceMap,m.iridescenceMapTransform)),p.iridescenceThicknessMap&&(m.iridescenceThicknessMap.value=p.iridescenceThicknessMap,e(p.iridescenceThicknessMap,m.iridescenceThicknessMapTransform))),p.transmission>0&&(m.transmission.value=p.transmission,m.transmissionSamplerMap.value=M.texture,m.transmissionSamplerSize.value.set(M.width,M.height),p.transmissionMap&&(m.transmissionMap.value=p.transmissionMap,e(p.transmissionMap,m.transmissionMapTransform)),m.thickness.value=p.thickness,p.thicknessMap&&(m.thicknessMap.value=p.thicknessMap,e(p.thicknessMap,m.thicknessMapTransform)),m.attenuationDistance.value=p.attenuationDistance,m.attenuationColor.value.copy(p.attenuationColor)),p.anisotropy>0&&(m.anisotropyVector.value.set(p.anisotropy*Math.cos(p.anisotropyRotation),p.anisotropy*Math.sin(p.anisotropyRotation)),p.anisotropyMap&&(m.anisotropyMap.value=p.anisotropyMap,e(p.anisotropyMap,m.anisotropyMapTransform))),m.specularIntensity.value=p.specularIntensity,m.specularColor.value.copy(p.specularColor),p.specularColorMap&&(m.specularColorMap.value=p.specularColorMap,e(p.specularColorMap,m.specularColorMapTransform)),p.specularIntensityMap&&(m.specularIntensityMap.value=p.specularIntensityMap,e(p.specularIntensityMap,m.specularIntensityMapTransform))}function g(m,p){p.matcap&&(m.matcap.value=p.matcap)}function _(m,p){const M=t.get(p).light;m.referencePosition.value.setFromMatrixPosition(M.matrixWorld),m.nearDistance.value=M.shadow.camera.near,m.farDistance.value=M.shadow.camera.far}return{refreshFogUniforms:n,refreshMaterialUniforms:s}}function F_(i,t,e,n){let s={},r={},o=[];const a=i.getParameter(i.MAX_UNIFORM_BUFFER_BINDINGS);function l(M,x){const E=x.program;n.uniformBlockBinding(M,E)}function c(M,x){let E=s[M.id];E===void 0&&(g(M),E=h(M),s[M.id]=E,M.addEventListener("dispose",m));const A=x.program;n.updateUBOMapping(M,A);const b=t.render.frame;r[M.id]!==b&&(u(M),r[M.id]=b)}function h(M){const x=f();M.__bindingPointIndex=x;const E=i.createBuffer(),A=M.__size,b=M.usage;return i.bindBuffer(i.UNIFORM_BUFFER,E),i.bufferData(i.UNIFORM_BUFFER,A,b),i.bindBuffer(i.UNIFORM_BUFFER,null),i.bindBufferBase(i.UNIFORM_BUFFER,x,E),E}function f(){for(let M=0;M<a;M++)if(o.indexOf(M)===-1)return o.push(M),M;return console.error("THREE.WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function u(M){const x=s[M.id],E=M.uniforms,A=M.__cache;i.bindBuffer(i.UNIFORM_BUFFER,x);for(let b=0,S=E.length;b<S;b++){const P=Array.isArray(E[b])?E[b]:[E[b]];for(let T=0,v=P.length;T<v;T++){const R=P[T];if(d(R,b,T,A)===!0){const L=R.__offset,D=Array.isArray(R.value)?R.value:[R.value];let N=0;for(let z=0;z<D.length;z++){const O=D[z],Y=_(O);typeof O=="number"||typeof O=="boolean"?(R.__data[0]=O,i.bufferSubData(i.UNIFORM_BUFFER,L+N,R.__data)):O.isMatrix3?(R.__data[0]=O.elements[0],R.__data[1]=O.elements[1],R.__data[2]=O.elements[2],R.__data[3]=0,R.__data[4]=O.elements[3],R.__data[5]=O.elements[4],R.__data[6]=O.elements[5],R.__data[7]=0,R.__data[8]=O.elements[6],R.__data[9]=O.elements[7],R.__data[10]=O.elements[8],R.__data[11]=0):(O.toArray(R.__data,N),N+=Y.storage/Float32Array.BYTES_PER_ELEMENT)}i.bufferSubData(i.UNIFORM_BUFFER,L,R.__data)}}}i.bindBuffer(i.UNIFORM_BUFFER,null)}function d(M,x,E,A){const b=M.value,S=x+"_"+E;if(A[S]===void 0)return typeof b=="number"||typeof b=="boolean"?A[S]=b:A[S]=b.clone(),!0;{const P=A[S];if(typeof b=="number"||typeof b=="boolean"){if(P!==b)return A[S]=b,!0}else if(P.equals(b)===!1)return P.copy(b),!0}return!1}function g(M){const x=M.uniforms;let E=0;const A=16;for(let S=0,P=x.length;S<P;S++){const T=Array.isArray(x[S])?x[S]:[x[S]];for(let v=0,R=T.length;v<R;v++){const L=T[v],D=Array.isArray(L.value)?L.value:[L.value];for(let N=0,z=D.length;N<z;N++){const O=D[N],Y=_(O),B=E%A;B!==0&&A-B<Y.boundary&&(E+=A-B),L.__data=new Float32Array(Y.storage/Float32Array.BYTES_PER_ELEMENT),L.__offset=E,E+=Y.storage}}}const b=E%A;return b>0&&(E+=A-b),M.__size=E,M.__cache={},this}function _(M){const x={boundary:0,storage:0};return typeof M=="number"||typeof M=="boolean"?(x.boundary=4,x.storage=4):M.isVector2?(x.boundary=8,x.storage=8):M.isVector3||M.isColor?(x.boundary=16,x.storage=12):M.isVector4?(x.boundary=16,x.storage=16):M.isMatrix3?(x.boundary=48,x.storage=48):M.isMatrix4?(x.boundary=64,x.storage=64):M.isTexture?console.warn("THREE.WebGLRenderer: Texture samplers can not be part of an uniforms group."):console.warn("THREE.WebGLRenderer: Unsupported uniform value type.",M),x}function m(M){const x=M.target;x.removeEventListener("dispose",m);const E=o.indexOf(x.__bindingPointIndex);o.splice(E,1),i.deleteBuffer(s[x.id]),delete s[x.id],delete r[x.id]}function p(){for(const M in s)i.deleteBuffer(s[M]);o=[],s={},r={}}return{bind:l,update:c,dispose:p}}class O_{constructor(t={}){const{canvas:e=Cf(),context:n=null,depth:s=!0,stencil:r=!1,alpha:o=!1,antialias:a=!1,premultipliedAlpha:l=!0,preserveDrawingBuffer:c=!1,powerPreference:h="default",failIfMajorPerformanceCaveat:f=!1}=t;this.isWebGLRenderer=!0;let u;if(n!==null){if(typeof WebGLRenderingContext<"u"&&n instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");u=n.getContextAttributes().alpha}else u=o;const d=new Uint32Array(4),g=new Int32Array(4);let _=null,m=null;const p=[],M=[];this.domElement=e,this.debug={checkShaderErrors:!0,onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this._outputColorSpace=Sn,this.toneMapping=ai,this.toneMappingExposure=1;const x=this;let E=!1,A=0,b=0,S=null,P=-1,T=null;const v=new Ee,R=new Ee;let L=null;const D=new jt(0);let N=0,z=e.width,O=e.height,Y=1,B=null,it=null;const st=new Ee(0,0,z,O),ht=new Ee(0,0,z,O);let Pt=!1;const Wt=new Va;let K=!1,et=!1;const pt=new Kt,lt=new I,Ot={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0};let Rt=!1;function Xt(){return S===null?Y:1}let F=n;function qt(C,k){return e.getContext(C,k)}try{const C={alpha:!0,depth:s,stencil:r,antialias:a,premultipliedAlpha:l,preserveDrawingBuffer:c,powerPreference:h,failIfMajorPerformanceCaveat:f};if("setAttribute"in e&&e.setAttribute("data-engine",`three.js r${Ba}`),e.addEventListener("webglcontextlost",q,!1),e.addEventListener("webglcontextrestored",G,!1),e.addEventListener("webglcontextcreationerror",j,!1),F===null){const k="webgl2";if(F=qt(k,C),F===null)throw qt(k)?new Error("Error creating WebGL context with your selected attributes."):new Error("Error creating WebGL context.")}}catch(C){throw console.error("THREE.WebGLRenderer: "+C.message),C}let zt,Qt,_t,Ht,Bt,wt,$t,U,w,X,Z,tt,J,vt,ot,at,Ut,nt,mt,kt,Et,ct,It,Tt;function re(){zt=new Xm(F),zt.init(),ct=new w_(F,zt),Qt=new Bm(F,zt,t,ct),_t=new b_(F),Ht=new jm(F),Bt=new h_,wt=new A_(F,zt,_t,Bt,Qt,ct,Ht),$t=new Hm(x),U=new Wm(x),w=new ed(F),It=new Om(F,w),X=new qm(F,w,Ht,It),Z=new $m(F,X,w,Ht),mt=new Km(F,Qt,wt),at=new km(Bt),tt=new u_(x,$t,U,zt,Qt,It,at),J=new N_(x,Bt),vt=new d_,ot=new v_(zt),nt=new Fm(x,$t,U,_t,Z,u,l),Ut=new T_(x,Z,Qt),Tt=new F_(F,Ht,Qt,_t),kt=new zm(F,zt,Ht),Et=new Ym(F,zt,Ht),Ht.programs=tt.programs,x.capabilities=Qt,x.extensions=zt,x.properties=Bt,x.renderLists=vt,x.shadowMap=Ut,x.state=_t,x.info=Ht}re();const y=new U_(x,F);this.xr=y,this.getContext=function(){return F},this.getContextAttributes=function(){return F.getContextAttributes()},this.forceContextLoss=function(){const C=zt.get("WEBGL_lose_context");C&&C.loseContext()},this.forceContextRestore=function(){const C=zt.get("WEBGL_lose_context");C&&C.restoreContext()},this.getPixelRatio=function(){return Y},this.setPixelRatio=function(C){C!==void 0&&(Y=C,this.setSize(z,O,!1))},this.getSize=function(C){return C.set(z,O)},this.setSize=function(C,k,V=!0){if(y.isPresenting){console.warn("THREE.WebGLRenderer: Can't change size while VR device is presenting.");return}z=C,O=k,e.width=Math.floor(C*Y),e.height=Math.floor(k*Y),V===!0&&(e.style.width=C+"px",e.style.height=k+"px"),this.setViewport(0,0,C,k)},this.getDrawingBufferSize=function(C){return C.set(z*Y,O*Y).floor()},this.setDrawingBufferSize=function(C,k,V){z=C,O=k,Y=V,e.width=Math.floor(C*V),e.height=Math.floor(k*V),this.setViewport(0,0,C,k)},this.getCurrentViewport=function(C){return C.copy(v)},this.getViewport=function(C){return C.copy(st)},this.setViewport=function(C,k,V,W){C.isVector4?st.set(C.x,C.y,C.z,C.w):st.set(C,k,V,W),_t.viewport(v.copy(st).multiplyScalar(Y).round())},this.getScissor=function(C){return C.copy(ht)},this.setScissor=function(C,k,V,W){C.isVector4?ht.set(C.x,C.y,C.z,C.w):ht.set(C,k,V,W),_t.scissor(R.copy(ht).multiplyScalar(Y).round())},this.getScissorTest=function(){return Pt},this.setScissorTest=function(C){_t.setScissorTest(Pt=C)},this.setOpaqueSort=function(C){B=C},this.setTransparentSort=function(C){it=C},this.getClearColor=function(C){return C.copy(nt.getClearColor())},this.setClearColor=function(){nt.setClearColor.apply(nt,arguments)},this.getClearAlpha=function(){return nt.getClearAlpha()},this.setClearAlpha=function(){nt.setClearAlpha.apply(nt,arguments)},this.clear=function(C=!0,k=!0,V=!0){let W=0;if(C){let H=!1;if(S!==null){const rt=S.texture.format;H=rt===Tu||rt===Eu||rt===yu}if(H){const rt=S.texture.type,ft=rt===li||rt===Ms||rt===Qr||rt===Ss||rt===Mu||rt===Su,gt=nt.getClearColor(),xt=nt.getClearAlpha(),Lt=gt.r,Dt=gt.g,Ct=gt.b;ft?(d[0]=Lt,d[1]=Dt,d[2]=Ct,d[3]=xt,F.clearBufferuiv(F.COLOR,0,d)):(g[0]=Lt,g[1]=Dt,g[2]=Ct,g[3]=xt,F.clearBufferiv(F.COLOR,0,g))}else W|=F.COLOR_BUFFER_BIT}k&&(W|=F.DEPTH_BUFFER_BIT),V&&(W|=F.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),F.clear(W)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.dispose=function(){e.removeEventListener("webglcontextlost",q,!1),e.removeEventListener("webglcontextrestored",G,!1),e.removeEventListener("webglcontextcreationerror",j,!1),vt.dispose(),ot.dispose(),Bt.dispose(),$t.dispose(),U.dispose(),Z.dispose(),It.dispose(),Tt.dispose(),tt.dispose(),y.dispose(),y.removeEventListener("sessionstart",le),y.removeEventListener("sessionend",ue),we.stop()};function q(C){C.preventDefault(),console.log("THREE.WebGLRenderer: Context Lost."),E=!0}function G(){console.log("THREE.WebGLRenderer: Context Restored."),E=!1;const C=Ht.autoReset,k=Ut.enabled,V=Ut.autoUpdate,W=Ut.needsUpdate,H=Ut.type;re(),Ht.autoReset=C,Ut.enabled=k,Ut.autoUpdate=V,Ut.needsUpdate=W,Ut.type=H}function j(C){console.error("THREE.WebGLRenderer: A WebGL context could not be created. Reason: ",C.statusMessage)}function Q(C){const k=C.target;k.removeEventListener("dispose",Q),Mt(k)}function Mt(C){St(C),Bt.remove(C)}function St(C){const k=Bt.get(C).programs;k!==void 0&&(k.forEach(function(V){tt.releaseProgram(V)}),C.isShaderMaterial&&tt.releaseShaderCache(C))}this.renderBufferDirect=function(C,k,V,W,H,rt){k===null&&(k=Ot);const ft=H.isMesh&&H.matrixWorld.determinant()<0,gt=Re(C,k,V,W,H);_t.setMaterial(W,ft);let xt=V.index,Lt=1;if(W.wireframe===!0){if(xt=X.getWireframeAttribute(V),xt===void 0)return;Lt=2}const Dt=V.drawRange,Ct=V.attributes.position;let Zt=Dt.start*Lt,fe=(Dt.start+Dt.count)*Lt;rt!==null&&(Zt=Math.max(Zt,rt.start*Lt),fe=Math.min(fe,(rt.start+rt.count)*Lt)),xt!==null?(Zt=Math.max(Zt,0),fe=Math.min(fe,xt.count)):Ct!=null&&(Zt=Math.max(Zt,0),fe=Math.min(fe,Ct.count));const de=fe-Zt;if(de<0||de===1/0)return;It.setup(H,W,gt,V,xt);let qe,ee=kt;if(xt!==null&&(qe=w.get(xt),ee=Et,ee.setIndex(qe)),H.isMesh)W.wireframe===!0?(_t.setLineWidth(W.wireframeLinewidth*Xt()),ee.setMode(F.LINES)):ee.setMode(F.TRIANGLES);else if(H.isLine){let yt=W.linewidth;yt===void 0&&(yt=1),_t.setLineWidth(yt*Xt()),H.isLineSegments?ee.setMode(F.LINES):H.isLineLoop?ee.setMode(F.LINE_LOOP):ee.setMode(F.LINE_STRIP)}else H.isPoints?ee.setMode(F.POINTS):H.isSprite&&ee.setMode(F.TRIANGLES);if(H.isBatchedMesh)H._multiDrawInstances!==null?ee.renderMultiDrawInstances(H._multiDrawStarts,H._multiDrawCounts,H._multiDrawCount,H._multiDrawInstances):ee.renderMultiDraw(H._multiDrawStarts,H._multiDrawCounts,H._multiDrawCount);else if(H.isInstancedMesh)ee.renderInstances(Zt,de,H.count);else if(V.isInstancedBufferGeometry){const yt=V._maxInstanceCount!==void 0?V._maxInstanceCount:1/0,Ue=Math.min(V.instanceCount,yt);ee.renderInstances(Zt,de,Ue)}else ee.render(Zt,de)};function te(C,k,V){C.transparent===!0&&C.side===En&&C.forceSinglePass===!1?(C.side=Fe,C.needsUpdate=!0,fi(C,k,V),C.side=wn,C.needsUpdate=!0,fi(C,k,V),C.side=En):fi(C,k,V)}this.compile=function(C,k,V=null){V===null&&(V=C),m=ot.get(V),m.init(k),M.push(m),V.traverseVisible(function(H){H.isLight&&H.layers.test(k.layers)&&(m.pushLight(H),H.castShadow&&m.pushShadow(H))}),C!==V&&C.traverseVisible(function(H){H.isLight&&H.layers.test(k.layers)&&(m.pushLight(H),H.castShadow&&m.pushShadow(H))}),m.setupLights();const W=new Set;return C.traverse(function(H){const rt=H.material;if(rt)if(Array.isArray(rt))for(let ft=0;ft<rt.length;ft++){const gt=rt[ft];te(gt,V,H),W.add(gt)}else te(rt,V,H),W.add(rt)}),M.pop(),m=null,W},this.compileAsync=function(C,k,V=null){const W=this.compile(C,k,V);return new Promise(H=>{function rt(){if(W.forEach(function(ft){Bt.get(ft).currentProgram.isReady()&&W.delete(ft)}),W.size===0){H(C);return}setTimeout(rt,10)}zt.get("KHR_parallel_shader_compile")!==null?rt():setTimeout(rt,10)})};let ce=null;function Yt(C){ce&&ce(C)}function le(){we.stop()}function ue(){we.start()}const we=new zu;we.setAnimationLoop(Yt),typeof self<"u"&&we.setContext(self),this.setAnimationLoop=function(C){ce=C,y.setAnimationLoop(C),C===null?we.stop():we.start()},y.addEventListener("sessionstart",le),y.addEventListener("sessionend",ue),this.render=function(C,k){if(k!==void 0&&k.isCamera!==!0){console.error("THREE.WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(E===!0)return;if(C.matrixWorldAutoUpdate===!0&&C.updateMatrixWorld(),k.parent===null&&k.matrixWorldAutoUpdate===!0&&k.updateMatrixWorld(),y.enabled===!0&&y.isPresenting===!0&&(y.cameraAutoUpdate===!0&&y.updateCamera(k),k=y.getCamera()),C.isScene===!0&&C.onBeforeRender(x,C,k,S),m=ot.get(C,M.length),m.init(k),M.push(m),pt.multiplyMatrices(k.projectionMatrix,k.matrixWorldInverse),Wt.setFromProjectionMatrix(pt),et=this.localClippingEnabled,K=at.init(this.clippingPlanes,et),_=vt.get(C,p.length),_.init(),p.push(_),y.enabled===!0&&y.isPresenting===!0){const rt=x.xr.getDepthSensingMesh();rt!==null&&Te(rt,k,-1/0,x.sortObjects)}Te(C,k,0,x.sortObjects),_.finish(),x.sortObjects===!0&&_.sort(B,it),Rt=y.enabled===!1||y.isPresenting===!1||y.hasDepthSensing()===!1,Rt&&nt.addToRenderList(_,C),this.info.render.frame++,K===!0&&at.beginShadows();const V=m.state.shadowsArray;Ut.render(V,C,k),K===!0&&at.endShadows(),this.info.autoReset===!0&&this.info.reset();const W=_.opaque,H=_.transmissive;if(m.setupLights(),k.isArrayCamera){const rt=k.cameras;if(H.length>0)for(let ft=0,gt=rt.length;ft<gt;ft++){const xt=rt[ft];Mn(W,H,C,xt)}Rt&&nt.render(C);for(let ft=0,gt=rt.length;ft<gt;ft++){const xt=rt[ft];Qe(_,C,xt,xt.viewport)}}else H.length>0&&Mn(W,H,C,k),Rt&&nt.render(C),Qe(_,C,k);S!==null&&(wt.updateMultisampleRenderTarget(S),wt.updateRenderTargetMipmap(S)),C.isScene===!0&&C.onAfterRender(x,C,k),It.resetDefaultState(),P=-1,T=null,M.pop(),M.length>0?(m=M[M.length-1],K===!0&&at.setGlobalState(x.clippingPlanes,m.state.camera)):m=null,p.pop(),p.length>0?_=p[p.length-1]:_=null};function Te(C,k,V,W){if(C.visible===!1)return;if(C.layers.test(k.layers)){if(C.isGroup)V=C.renderOrder;else if(C.isLOD)C.autoUpdate===!0&&C.update(k);else if(C.isLight)m.pushLight(C),C.castShadow&&m.pushShadow(C);else if(C.isSprite){if(!C.frustumCulled||Wt.intersectsSprite(C)){W&&lt.setFromMatrixPosition(C.matrixWorld).applyMatrix4(pt);const ft=Z.update(C),gt=C.material;gt.visible&&_.push(C,ft,gt,V,lt.z,null)}}else if((C.isMesh||C.isLine||C.isPoints)&&(!C.frustumCulled||Wt.intersectsObject(C))){const ft=Z.update(C),gt=C.material;if(W&&(C.boundingSphere!==void 0?(C.boundingSphere===null&&C.computeBoundingSphere(),lt.copy(C.boundingSphere.center)):(ft.boundingSphere===null&&ft.computeBoundingSphere(),lt.copy(ft.boundingSphere.center)),lt.applyMatrix4(C.matrixWorld).applyMatrix4(pt)),Array.isArray(gt)){const xt=ft.groups;for(let Lt=0,Dt=xt.length;Lt<Dt;Lt++){const Ct=xt[Lt],Zt=gt[Ct.materialIndex];Zt&&Zt.visible&&_.push(C,ft,Zt,V,lt.z,Ct)}}else gt.visible&&_.push(C,ft,gt,V,lt.z,null)}}const rt=C.children;for(let ft=0,gt=rt.length;ft<gt;ft++)Te(rt[ft],k,V,W)}function Qe(C,k,V,W){const H=C.opaque,rt=C.transmissive,ft=C.transparent;m.setupLightsView(V),K===!0&&at.setGlobalState(x.clippingPlanes,V),W&&_t.viewport(v.copy(W)),H.length>0&&he(H,k,V),rt.length>0&&he(rt,k,V),ft.length>0&&he(ft,k,V),_t.buffers.depth.setTest(!0),_t.buffers.depth.setMask(!0),_t.buffers.color.setMask(!0),_t.setPolygonOffset(!1)}function Mn(C,k,V,W){if((V.isScene===!0?V.overrideMaterial:null)!==null)return;m.state.transmissionRenderTarget[W.id]===void 0&&(m.state.transmissionRenderTarget[W.id]=new Ri(1,1,{generateMipmaps:!0,type:zt.has("EXT_color_buffer_half_float")||zt.has("EXT_color_buffer_float")?ho:li,minFilter:wi,samples:4,stencilBuffer:r,resolveDepthBuffer:!1,resolveStencilBuffer:!1,colorSpace:ne.workingColorSpace}));const rt=m.state.transmissionRenderTarget[W.id],ft=W.viewport||v;rt.setSize(ft.z,ft.w);const gt=x.getRenderTarget();x.setRenderTarget(rt),x.getClearColor(D),N=x.getClearAlpha(),N<1&&x.setClearColor(16777215,.5),Rt?nt.render(V):x.clear();const xt=x.toneMapping;x.toneMapping=ai;const Lt=W.viewport;if(W.viewport!==void 0&&(W.viewport=void 0),m.setupLightsView(W),K===!0&&at.setGlobalState(x.clippingPlanes,W),he(C,V,W),wt.updateMultisampleRenderTarget(rt),wt.updateRenderTargetMipmap(rt),zt.has("WEBGL_multisampled_render_to_texture")===!1){let Dt=!1;for(let Ct=0,Zt=k.length;Ct<Zt;Ct++){const fe=k[Ct],de=fe.object,qe=fe.geometry,ee=fe.material,yt=fe.group;if(ee.side===En&&de.layers.test(W.layers)){const Ue=ee.side;ee.side=Fe,ee.needsUpdate=!0,be(de,V,W,qe,ee,yt),ee.side=Ue,ee.needsUpdate=!0,Dt=!0}}Dt===!0&&(wt.updateMultisampleRenderTarget(rt),wt.updateRenderTargetMipmap(rt))}x.setRenderTarget(gt),x.setClearColor(D,N),Lt!==void 0&&(W.viewport=Lt),x.toneMapping=xt}function he(C,k,V){const W=k.isScene===!0?k.overrideMaterial:null;for(let H=0,rt=C.length;H<rt;H++){const ft=C[H],gt=ft.object,xt=ft.geometry,Lt=W===null?ft.material:W,Dt=ft.group;gt.layers.test(V.layers)&&be(gt,k,V,xt,Lt,Dt)}}function be(C,k,V,W,H,rt){C.onBeforeRender(x,k,V,W,H,rt),C.modelViewMatrix.multiplyMatrices(V.matrixWorldInverse,C.matrixWorld),C.normalMatrix.getNormalMatrix(C.modelViewMatrix),H.onBeforeRender(x,k,V,W,C,rt),H.transparent===!0&&H.side===En&&H.forceSinglePass===!1?(H.side=Fe,H.needsUpdate=!0,x.renderBufferDirect(V,k,W,H,C,rt),H.side=wn,H.needsUpdate=!0,x.renderBufferDirect(V,k,W,H,C,rt),H.side=En):x.renderBufferDirect(V,k,W,H,C,rt),C.onAfterRender(x,k,V,W,H,rt)}function fi(C,k,V){k.isScene!==!0&&(k=Ot);const W=Bt.get(C),H=m.state.lights,rt=m.state.shadowsArray,ft=H.state.version,gt=tt.getParameters(C,H.state,rt,k,V),xt=tt.getProgramCacheKey(gt);let Lt=W.programs;W.environment=C.isMeshStandardMaterial?k.environment:null,W.fog=k.fog,W.envMap=(C.isMeshStandardMaterial?U:$t).get(C.envMap||W.environment),W.envMapRotation=W.environment!==null&&C.envMap===null?k.environmentRotation:C.envMapRotation,Lt===void 0&&(C.addEventListener("dispose",Q),Lt=new Map,W.programs=Lt);let Dt=Lt.get(xt);if(Dt!==void 0){if(W.currentProgram===Dt&&W.lightsStateVersion===ft)return Xe(C,gt),Dt}else gt.uniforms=tt.getUniforms(C),C.onBuild(V,gt,x),C.onBeforeCompile(gt,x),Dt=tt.acquireProgram(gt,xt),Lt.set(xt,Dt),W.uniforms=gt.uniforms;const Ct=W.uniforms;return(!C.isShaderMaterial&&!C.isRawShaderMaterial||C.clipping===!0)&&(Ct.clippingPlanes=at.uniform),Xe(C,gt),W.needsLights=ie(C),W.lightsStateVersion=ft,W.needsLights&&(Ct.ambientLightColor.value=H.state.ambient,Ct.lightProbe.value=H.state.probe,Ct.directionalLights.value=H.state.directional,Ct.directionalLightShadows.value=H.state.directionalShadow,Ct.spotLights.value=H.state.spot,Ct.spotLightShadows.value=H.state.spotShadow,Ct.rectAreaLights.value=H.state.rectArea,Ct.ltc_1.value=H.state.rectAreaLTC1,Ct.ltc_2.value=H.state.rectAreaLTC2,Ct.pointLights.value=H.state.point,Ct.pointLightShadows.value=H.state.pointShadow,Ct.hemisphereLights.value=H.state.hemi,Ct.directionalShadowMap.value=H.state.directionalShadowMap,Ct.directionalShadowMatrix.value=H.state.directionalShadowMatrix,Ct.spotShadowMap.value=H.state.spotShadowMap,Ct.spotLightMatrix.value=H.state.spotLightMatrix,Ct.spotLightMap.value=H.state.spotLightMap,Ct.pointShadowMap.value=H.state.pointShadowMap,Ct.pointShadowMatrix.value=H.state.pointShadowMatrix),W.currentProgram=Dt,W.uniformsList=null,Dt}function di(C){if(C.uniformsList===null){const k=C.currentProgram.getUniforms();C.uniformsList=Wr.seqWithValue(k.seq,C.uniforms)}return C.uniformsList}function Xe(C,k){const V=Bt.get(C);V.outputColorSpace=k.outputColorSpace,V.batching=k.batching,V.batchingColor=k.batchingColor,V.instancing=k.instancing,V.instancingColor=k.instancingColor,V.instancingMorph=k.instancingMorph,V.skinning=k.skinning,V.morphTargets=k.morphTargets,V.morphNormals=k.morphNormals,V.morphColors=k.morphColors,V.morphTargetsCount=k.morphTargetsCount,V.numClippingPlanes=k.numClippingPlanes,V.numIntersection=k.numClipIntersection,V.vertexAlphas=k.vertexAlphas,V.vertexTangents=k.vertexTangents,V.toneMapping=k.toneMapping}function Re(C,k,V,W,H){k.isScene!==!0&&(k=Ot),wt.resetTextureUnits();const rt=k.fog,ft=W.isMeshStandardMaterial?k.environment:null,gt=S===null?x.outputColorSpace:S.isXRRenderTarget===!0?S.texture.colorSpace:hi,xt=(W.isMeshStandardMaterial?U:$t).get(W.envMap||ft),Lt=W.vertexColors===!0&&!!V.attributes.color&&V.attributes.color.itemSize===4,Dt=!!V.attributes.tangent&&(!!W.normalMap||W.anisotropy>0),Ct=!!V.morphAttributes.position,Zt=!!V.morphAttributes.normal,fe=!!V.morphAttributes.color;let de=ai;W.toneMapped&&(S===null||S.isXRRenderTarget===!0)&&(de=x.toneMapping);const qe=V.morphAttributes.position||V.morphAttributes.normal||V.morphAttributes.color,ee=qe!==void 0?qe.length:0,yt=Bt.get(W),Ue=m.state.lights;if(K===!0&&(et===!0||C!==T)){const tn=C===T&&W.id===P;at.setState(W,C,tn)}let se=!1;W.version===yt.__version?(yt.needsLights&&yt.lightsStateVersion!==Ue.state.version||yt.outputColorSpace!==gt||H.isBatchedMesh&&yt.batching===!1||!H.isBatchedMesh&&yt.batching===!0||H.isBatchedMesh&&yt.batchingColor===!0&&H.colorTexture===null||H.isBatchedMesh&&yt.batchingColor===!1&&H.colorTexture!==null||H.isInstancedMesh&&yt.instancing===!1||!H.isInstancedMesh&&yt.instancing===!0||H.isSkinnedMesh&&yt.skinning===!1||!H.isSkinnedMesh&&yt.skinning===!0||H.isInstancedMesh&&yt.instancingColor===!0&&H.instanceColor===null||H.isInstancedMesh&&yt.instancingColor===!1&&H.instanceColor!==null||H.isInstancedMesh&&yt.instancingMorph===!0&&H.morphTexture===null||H.isInstancedMesh&&yt.instancingMorph===!1&&H.morphTexture!==null||yt.envMap!==xt||W.fog===!0&&yt.fog!==rt||yt.numClippingPlanes!==void 0&&(yt.numClippingPlanes!==at.numPlanes||yt.numIntersection!==at.numIntersection)||yt.vertexAlphas!==Lt||yt.vertexTangents!==Dt||yt.morphTargets!==Ct||yt.morphNormals!==Zt||yt.morphColors!==fe||yt.toneMapping!==de||yt.morphTargetsCount!==ee)&&(se=!0):(se=!0,yt.__version=W.version);let Pn=yt.currentProgram;se===!0&&(Pn=fi(W,k,H));let tr=!1,pi=!1,_o=!1;const Se=Pn.getUniforms(),Vn=yt.uniforms;if(_t.useProgram(Pn.program)&&(tr=!0,pi=!0,_o=!0),W.id!==P&&(P=W.id,pi=!0),tr||T!==C){Se.setValue(F,"projectionMatrix",C.projectionMatrix),Se.setValue(F,"viewMatrix",C.matrixWorldInverse);const tn=Se.map.cameraPosition;tn!==void 0&&tn.setValue(F,lt.setFromMatrixPosition(C.matrixWorld)),Qt.logarithmicDepthBuffer&&Se.setValue(F,"logDepthBufFC",2/(Math.log(C.far+1)/Math.LN2)),(W.isMeshPhongMaterial||W.isMeshToonMaterial||W.isMeshLambertMaterial||W.isMeshBasicMaterial||W.isMeshStandardMaterial||W.isShaderMaterial)&&Se.setValue(F,"isOrthographic",C.isOrthographicCamera===!0),T!==C&&(T=C,pi=!0,_o=!0)}if(H.isSkinnedMesh){Se.setOptional(F,H,"bindMatrix"),Se.setOptional(F,H,"bindMatrixInverse");const tn=H.skeleton;tn&&(tn.boneTexture===null&&tn.computeBoneTexture(),Se.setValue(F,"boneTexture",tn.boneTexture,wt))}H.isBatchedMesh&&(Se.setOptional(F,H,"batchingTexture"),Se.setValue(F,"batchingTexture",H._matricesTexture,wt),Se.setOptional(F,H,"batchingColorTexture"),H._colorsTexture!==null&&Se.setValue(F,"batchingColorTexture",H._colorsTexture,wt));const xo=V.morphAttributes;if((xo.position!==void 0||xo.normal!==void 0||xo.color!==void 0)&&mt.update(H,V,Pn),(pi||yt.receiveShadow!==H.receiveShadow)&&(yt.receiveShadow=H.receiveShadow,Se.setValue(F,"receiveShadow",H.receiveShadow)),W.isMeshGouraudMaterial&&W.envMap!==null&&(Vn.envMap.value=xt,Vn.flipEnvMap.value=xt.isCubeTexture&&xt.isRenderTargetTexture===!1?-1:1),W.isMeshStandardMaterial&&W.envMap===null&&k.environment!==null&&(Vn.envMapIntensity.value=k.environmentIntensity),pi&&(Se.setValue(F,"toneMappingExposure",x.toneMappingExposure),yt.needsLights&&Ft(Vn,_o),rt&&W.fog===!0&&J.refreshFogUniforms(Vn,rt),J.refreshMaterialUniforms(Vn,W,Y,O,m.state.transmissionRenderTarget[C.id]),Wr.upload(F,di(yt),Vn,wt)),W.isShaderMaterial&&W.uniformsNeedUpdate===!0&&(Wr.upload(F,di(yt),Vn,wt),W.uniformsNeedUpdate=!1),W.isSpriteMaterial&&Se.setValue(F,"center",H.center),Se.setValue(F,"modelViewMatrix",H.modelViewMatrix),Se.setValue(F,"normalMatrix",H.normalMatrix),Se.setValue(F,"modelMatrix",H.matrixWorld),W.isShaderMaterial||W.isRawShaderMaterial){const tn=W.uniformsGroups;for(let vo=0,ih=tn.length;vo<ih;vo++){const $a=tn[vo];Tt.update($a,Pn),Tt.bind($a,Pn)}}return Pn}function Ft(C,k){C.ambientLightColor.needsUpdate=k,C.lightProbe.needsUpdate=k,C.directionalLights.needsUpdate=k,C.directionalLightShadows.needsUpdate=k,C.pointLights.needsUpdate=k,C.pointLightShadows.needsUpdate=k,C.spotLights.needsUpdate=k,C.spotLightShadows.needsUpdate=k,C.rectAreaLights.needsUpdate=k,C.hemisphereLights.needsUpdate=k}function ie(C){return C.isMeshLambertMaterial||C.isMeshToonMaterial||C.isMeshPhongMaterial||C.isMeshStandardMaterial||C.isShadowMaterial||C.isShaderMaterial&&C.lights===!0}this.getActiveCubeFace=function(){return A},this.getActiveMipmapLevel=function(){return b},this.getRenderTarget=function(){return S},this.setRenderTargetTextures=function(C,k,V){Bt.get(C.texture).__webglTexture=k,Bt.get(C.depthTexture).__webglTexture=V;const W=Bt.get(C);W.__hasExternalTextures=!0,W.__autoAllocateDepthBuffer=V===void 0,W.__autoAllocateDepthBuffer||zt.has("WEBGL_multisampled_render_to_texture")===!0&&(console.warn("THREE.WebGLRenderer: Render-to-texture extension was disabled because an external texture was provided"),W.__useRenderToTexture=!1)},this.setRenderTargetFramebuffer=function(C,k){const V=Bt.get(C);V.__webglFramebuffer=k,V.__useDefaultFramebuffer=k===void 0},this.setRenderTarget=function(C,k=0,V=0){S=C,A=k,b=V;let W=!0,H=null,rt=!1,ft=!1;if(C){const xt=Bt.get(C);xt.__useDefaultFramebuffer!==void 0?(_t.bindFramebuffer(F.FRAMEBUFFER,null),W=!1):xt.__webglFramebuffer===void 0?wt.setupRenderTarget(C):xt.__hasExternalTextures&&wt.rebindTextures(C,Bt.get(C.texture).__webglTexture,Bt.get(C.depthTexture).__webglTexture);const Lt=C.texture;(Lt.isData3DTexture||Lt.isDataArrayTexture||Lt.isCompressedArrayTexture)&&(ft=!0);const Dt=Bt.get(C).__webglFramebuffer;C.isWebGLCubeRenderTarget?(Array.isArray(Dt[k])?H=Dt[k][V]:H=Dt[k],rt=!0):C.samples>0&&wt.useMultisampledRTT(C)===!1?H=Bt.get(C).__webglMultisampledFramebuffer:Array.isArray(Dt)?H=Dt[V]:H=Dt,v.copy(C.viewport),R.copy(C.scissor),L=C.scissorTest}else v.copy(st).multiplyScalar(Y).floor(),R.copy(ht).multiplyScalar(Y).floor(),L=Pt;if(_t.bindFramebuffer(F.FRAMEBUFFER,H)&&W&&_t.drawBuffers(C,H),_t.viewport(v),_t.scissor(R),_t.setScissorTest(L),rt){const xt=Bt.get(C.texture);F.framebufferTexture2D(F.FRAMEBUFFER,F.COLOR_ATTACHMENT0,F.TEXTURE_CUBE_MAP_POSITIVE_X+k,xt.__webglTexture,V)}else if(ft){const xt=Bt.get(C.texture),Lt=k||0;F.framebufferTextureLayer(F.FRAMEBUFFER,F.COLOR_ATTACHMENT0,xt.__webglTexture,V||0,Lt)}P=-1},this.readRenderTargetPixels=function(C,k,V,W,H,rt,ft){if(!(C&&C.isWebGLRenderTarget)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let gt=Bt.get(C).__webglFramebuffer;if(C.isWebGLCubeRenderTarget&&ft!==void 0&&(gt=gt[ft]),gt){_t.bindFramebuffer(F.FRAMEBUFFER,gt);try{const xt=C.texture,Lt=xt.format,Dt=xt.type;if(!Qt.textureFormatReadable(Lt)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(!Qt.textureTypeReadable(Dt)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}k>=0&&k<=C.width-W&&V>=0&&V<=C.height-H&&F.readPixels(k,V,W,H,ct.convert(Lt),ct.convert(Dt),rt)}finally{const xt=S!==null?Bt.get(S).__webglFramebuffer:null;_t.bindFramebuffer(F.FRAMEBUFFER,xt)}}},this.readRenderTargetPixelsAsync=async function(C,k,V,W,H,rt,ft){if(!(C&&C.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let gt=Bt.get(C).__webglFramebuffer;if(C.isWebGLCubeRenderTarget&&ft!==void 0&&(gt=gt[ft]),gt){_t.bindFramebuffer(F.FRAMEBUFFER,gt);try{const xt=C.texture,Lt=xt.format,Dt=xt.type;if(!Qt.textureFormatReadable(Lt))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(!Qt.textureTypeReadable(Dt))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");if(k>=0&&k<=C.width-W&&V>=0&&V<=C.height-H){const Ct=F.createBuffer();F.bindBuffer(F.PIXEL_PACK_BUFFER,Ct),F.bufferData(F.PIXEL_PACK_BUFFER,rt.byteLength,F.STREAM_READ),F.readPixels(k,V,W,H,ct.convert(Lt),ct.convert(Dt),0),F.flush();const Zt=F.fenceSync(F.SYNC_GPU_COMMANDS_COMPLETE,0);await Pf(F,Zt,4);try{F.bindBuffer(F.PIXEL_PACK_BUFFER,Ct),F.getBufferSubData(F.PIXEL_PACK_BUFFER,0,rt)}finally{F.deleteBuffer(Ct),F.deleteSync(Zt)}return rt}}finally{const xt=S!==null?Bt.get(S).__webglFramebuffer:null;_t.bindFramebuffer(F.FRAMEBUFFER,xt)}}},this.copyFramebufferToTexture=function(C,k=null,V=0){C.isTexture!==!0&&(console.warn("WebGLRenderer: copyFramebufferToTexture function signature has changed."),k=arguments[0]||null,C=arguments[1]);const W=Math.pow(2,-V),H=Math.floor(C.image.width*W),rt=Math.floor(C.image.height*W),ft=k!==null?k.x:0,gt=k!==null?k.y:0;wt.setTexture2D(C,0),F.copyTexSubImage2D(F.TEXTURE_2D,V,0,0,ft,gt,H,rt),_t.unbindTexture()},this.copyTextureToTexture=function(C,k,V=null,W=null,H=0){C.isTexture!==!0&&(console.warn("WebGLRenderer: copyTextureToTexture function signature has changed."),W=arguments[0]||null,C=arguments[1],k=arguments[2],H=arguments[3]||0,V=null);let rt,ft,gt,xt,Lt,Dt;V!==null?(rt=V.max.x-V.min.x,ft=V.max.y-V.min.y,gt=V.min.x,xt=V.min.y):(rt=C.image.width,ft=C.image.height,gt=0,xt=0),W!==null?(Lt=W.x,Dt=W.y):(Lt=0,Dt=0);const Ct=ct.convert(k.format),Zt=ct.convert(k.type);wt.setTexture2D(k,0),F.pixelStorei(F.UNPACK_FLIP_Y_WEBGL,k.flipY),F.pixelStorei(F.UNPACK_PREMULTIPLY_ALPHA_WEBGL,k.premultiplyAlpha),F.pixelStorei(F.UNPACK_ALIGNMENT,k.unpackAlignment);const fe=F.getParameter(F.UNPACK_ROW_LENGTH),de=F.getParameter(F.UNPACK_IMAGE_HEIGHT),qe=F.getParameter(F.UNPACK_SKIP_PIXELS),ee=F.getParameter(F.UNPACK_SKIP_ROWS),yt=F.getParameter(F.UNPACK_SKIP_IMAGES),Ue=C.isCompressedTexture?C.mipmaps[H]:C.image;F.pixelStorei(F.UNPACK_ROW_LENGTH,Ue.width),F.pixelStorei(F.UNPACK_IMAGE_HEIGHT,Ue.height),F.pixelStorei(F.UNPACK_SKIP_PIXELS,gt),F.pixelStorei(F.UNPACK_SKIP_ROWS,xt),C.isDataTexture?F.texSubImage2D(F.TEXTURE_2D,H,Lt,Dt,rt,ft,Ct,Zt,Ue.data):C.isCompressedTexture?F.compressedTexSubImage2D(F.TEXTURE_2D,H,Lt,Dt,Ue.width,Ue.height,Ct,Ue.data):F.texSubImage2D(F.TEXTURE_2D,H,Lt,Dt,Ct,Zt,Ue),F.pixelStorei(F.UNPACK_ROW_LENGTH,fe),F.pixelStorei(F.UNPACK_IMAGE_HEIGHT,de),F.pixelStorei(F.UNPACK_SKIP_PIXELS,qe),F.pixelStorei(F.UNPACK_SKIP_ROWS,ee),F.pixelStorei(F.UNPACK_SKIP_IMAGES,yt),H===0&&k.generateMipmaps&&F.generateMipmap(F.TEXTURE_2D),_t.unbindTexture()},this.copyTextureToTexture3D=function(C,k,V=null,W=null,H=0){C.isTexture!==!0&&(console.warn("WebGLRenderer: copyTextureToTexture3D function signature has changed."),V=arguments[0]||null,W=arguments[1]||null,C=arguments[2],k=arguments[3],H=arguments[4]||0);let rt,ft,gt,xt,Lt,Dt,Ct,Zt,fe;const de=C.isCompressedTexture?C.mipmaps[H]:C.image;V!==null?(rt=V.max.x-V.min.x,ft=V.max.y-V.min.y,gt=V.max.z-V.min.z,xt=V.min.x,Lt=V.min.y,Dt=V.min.z):(rt=de.width,ft=de.height,gt=de.depth,xt=0,Lt=0,Dt=0),W!==null?(Ct=W.x,Zt=W.y,fe=W.z):(Ct=0,Zt=0,fe=0);const qe=ct.convert(k.format),ee=ct.convert(k.type);let yt;if(k.isData3DTexture)wt.setTexture3D(k,0),yt=F.TEXTURE_3D;else if(k.isDataArrayTexture||k.isCompressedArrayTexture)wt.setTexture2DArray(k,0),yt=F.TEXTURE_2D_ARRAY;else{console.warn("THREE.WebGLRenderer.copyTextureToTexture3D: only supports THREE.DataTexture3D and THREE.DataTexture2DArray.");return}F.pixelStorei(F.UNPACK_FLIP_Y_WEBGL,k.flipY),F.pixelStorei(F.UNPACK_PREMULTIPLY_ALPHA_WEBGL,k.premultiplyAlpha),F.pixelStorei(F.UNPACK_ALIGNMENT,k.unpackAlignment);const Ue=F.getParameter(F.UNPACK_ROW_LENGTH),se=F.getParameter(F.UNPACK_IMAGE_HEIGHT),Pn=F.getParameter(F.UNPACK_SKIP_PIXELS),tr=F.getParameter(F.UNPACK_SKIP_ROWS),pi=F.getParameter(F.UNPACK_SKIP_IMAGES);F.pixelStorei(F.UNPACK_ROW_LENGTH,de.width),F.pixelStorei(F.UNPACK_IMAGE_HEIGHT,de.height),F.pixelStorei(F.UNPACK_SKIP_PIXELS,xt),F.pixelStorei(F.UNPACK_SKIP_ROWS,Lt),F.pixelStorei(F.UNPACK_SKIP_IMAGES,Dt),C.isDataTexture||C.isData3DTexture?F.texSubImage3D(yt,H,Ct,Zt,fe,rt,ft,gt,qe,ee,de.data):k.isCompressedArrayTexture?F.compressedTexSubImage3D(yt,H,Ct,Zt,fe,rt,ft,gt,qe,de.data):F.texSubImage3D(yt,H,Ct,Zt,fe,rt,ft,gt,qe,ee,de),F.pixelStorei(F.UNPACK_ROW_LENGTH,Ue),F.pixelStorei(F.UNPACK_IMAGE_HEIGHT,se),F.pixelStorei(F.UNPACK_SKIP_PIXELS,Pn),F.pixelStorei(F.UNPACK_SKIP_ROWS,tr),F.pixelStorei(F.UNPACK_SKIP_IMAGES,pi),H===0&&k.generateMipmaps&&F.generateMipmap(yt),_t.unbindTexture()},this.initRenderTarget=function(C){Bt.get(C).__webglFramebuffer===void 0&&wt.setupRenderTarget(C)},this.initTexture=function(C){C.isCubeTexture?wt.setTextureCube(C,0):C.isData3DTexture?wt.setTexture3D(C,0):C.isDataArrayTexture||C.isCompressedArrayTexture?wt.setTexture2DArray(C,0):wt.setTexture2D(C,0),_t.unbindTexture()},this.resetState=function(){A=0,b=0,S=null,_t.reset(),It.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return kn}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(t){this._outputColorSpace=t;const e=this.getContext();e.drawingBufferColorSpace=t===Ha?"display-p3":"srgb",e.unpackColorSpace=ne.workingColorSpace===fo?"display-p3":"srgb"}}class Xa{constructor(t,e=1,n=1e3){this.isFog=!0,this.name="",this.color=new jt(t),this.near=e,this.far=n}clone(){return new Xa(this.color,this.near,this.far)}toJSON(){return{type:"Fog",name:this.name,color:this.color.getHex(),near:this.near,far:this.far}}}class z_ extends Ae{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new Rn,this.environmentIntensity=1,this.environmentRotation=new Rn,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(t,e){return super.copy(t,e),t.background!==null&&(this.background=t.background.clone()),t.environment!==null&&(this.environment=t.environment.clone()),t.fog!==null&&(this.fog=t.fog.clone()),this.backgroundBlurriness=t.backgroundBlurriness,this.backgroundIntensity=t.backgroundIntensity,this.backgroundRotation.copy(t.backgroundRotation),this.environmentIntensity=t.environmentIntensity,this.environmentRotation.copy(t.environmentRotation),t.overrideMaterial!==null&&(this.overrideMaterial=t.overrideMaterial.clone()),this.matrixAutoUpdate=t.matrixAutoUpdate,this}toJSON(t){const e=super.toJSON(t);return this.fog!==null&&(e.object.fog=this.fog.toJSON()),this.backgroundBlurriness>0&&(e.object.backgroundBlurriness=this.backgroundBlurriness),this.backgroundIntensity!==1&&(e.object.backgroundIntensity=this.backgroundIntensity),e.object.backgroundRotation=this.backgroundRotation.toArray(),this.environmentIntensity!==1&&(e.object.environmentIntensity=this.environmentIntensity),e.object.environmentRotation=this.environmentRotation.toArray(),e}}class qu extends Ts{constructor(t){super(),this.isLineBasicMaterial=!0,this.type="LineBasicMaterial",this.color=new jt(16777215),this.map=null,this.linewidth=1,this.linecap="round",this.linejoin="round",this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.linewidth=t.linewidth,this.linecap=t.linecap,this.linejoin=t.linejoin,this.fog=t.fog,this}}const ro=new I,oo=new I,vc=new Kt,Ds=new Js,Er=new Zs,ta=new I,Mc=new I;class B_ extends Ae{constructor(t=new We,e=new qu){super(),this.isLine=!0,this.type="Line",this.geometry=t,this.material=e,this.updateMorphTargets()}copy(t,e){return super.copy(t,e),this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}computeLineDistances(){const t=this.geometry;if(t.index===null){const e=t.attributes.position,n=[0];for(let s=1,r=e.count;s<r;s++)ro.fromBufferAttribute(e,s-1),oo.fromBufferAttribute(e,s),n[s]=n[s-1],n[s]+=ro.distanceTo(oo);t.setAttribute("lineDistance",new Ve(n,1))}else console.warn("THREE.Line.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}raycast(t,e){const n=this.geometry,s=this.matrixWorld,r=t.params.Line.threshold,o=n.drawRange;if(n.boundingSphere===null&&n.computeBoundingSphere(),Er.copy(n.boundingSphere),Er.applyMatrix4(s),Er.radius+=r,t.ray.intersectsSphere(Er)===!1)return;vc.copy(s).invert(),Ds.copy(t.ray).applyMatrix4(vc);const a=r/((this.scale.x+this.scale.y+this.scale.z)/3),l=a*a,c=this.isLineSegments?2:1,h=n.index,u=n.attributes.position;if(h!==null){const d=Math.max(0,o.start),g=Math.min(h.count,o.start+o.count);for(let _=d,m=g-1;_<m;_+=c){const p=h.getX(_),M=h.getX(_+1),x=Tr(this,t,Ds,l,p,M);x&&e.push(x)}if(this.isLineLoop){const _=h.getX(g-1),m=h.getX(d),p=Tr(this,t,Ds,l,_,m);p&&e.push(p)}}else{const d=Math.max(0,o.start),g=Math.min(u.count,o.start+o.count);for(let _=d,m=g-1;_<m;_+=c){const p=Tr(this,t,Ds,l,_,_+1);p&&e.push(p)}if(this.isLineLoop){const _=Tr(this,t,Ds,l,g-1,d);_&&e.push(_)}}}updateMorphTargets(){const e=this.geometry.morphAttributes,n=Object.keys(e);if(n.length>0){const s=e[n[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,o=s.length;r<o;r++){const a=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=r}}}}}function Tr(i,t,e,n,s,r){const o=i.geometry.attributes.position;if(ro.fromBufferAttribute(o,s),oo.fromBufferAttribute(o,r),e.distanceSqToSegment(ro,oo,ta,Mc)>n)return;ta.applyMatrix4(i.matrixWorld);const l=t.ray.origin.distanceTo(ta);if(!(l<t.near||l>t.far))return{distance:l,point:Mc.clone().applyMatrix4(i.matrixWorld),index:s,face:null,faceIndex:null,object:i}}class ao extends We{constructor(t=1,e=1,n=1,s=32,r=1,o=!1,a=0,l=Math.PI*2){super(),this.type="CylinderGeometry",this.parameters={radiusTop:t,radiusBottom:e,height:n,radialSegments:s,heightSegments:r,openEnded:o,thetaStart:a,thetaLength:l};const c=this;s=Math.floor(s),r=Math.floor(r);const h=[],f=[],u=[],d=[];let g=0;const _=[],m=n/2;let p=0;M(),o===!1&&(t>0&&x(!0),e>0&&x(!1)),this.setIndex(h),this.setAttribute("position",new Ve(f,3)),this.setAttribute("normal",new Ve(u,3)),this.setAttribute("uv",new Ve(d,2));function M(){const E=new I,A=new I;let b=0;const S=(e-t)/n;for(let P=0;P<=r;P++){const T=[],v=P/r,R=v*(e-t)+t;for(let L=0;L<=s;L++){const D=L/s,N=D*l+a,z=Math.sin(N),O=Math.cos(N);A.x=R*z,A.y=-v*n+m,A.z=R*O,f.push(A.x,A.y,A.z),E.set(z,S,O).normalize(),u.push(E.x,E.y,E.z),d.push(D,1-v),T.push(g++)}_.push(T)}for(let P=0;P<s;P++)for(let T=0;T<r;T++){const v=_[T][P],R=_[T+1][P],L=_[T+1][P+1],D=_[T][P+1];h.push(v,R,D),h.push(R,L,D),b+=6}c.addGroup(p,b,0),p+=b}function x(E){const A=g,b=new At,S=new I;let P=0;const T=E===!0?t:e,v=E===!0?1:-1;for(let L=1;L<=s;L++)f.push(0,m*v,0),u.push(0,v,0),d.push(.5,.5),g++;const R=g;for(let L=0;L<=s;L++){const N=L/s*l+a,z=Math.cos(N),O=Math.sin(N);S.x=T*O,S.y=m*v,S.z=T*z,f.push(S.x,S.y,S.z),u.push(0,v,0),b.x=z*.5+.5,b.y=O*.5*v+.5,d.push(b.x,b.y),g++}for(let L=0;L<s;L++){const D=A+L,N=R+L;E===!0?h.push(N,N+1,D):h.push(N+1,N,D),P+=3}c.addGroup(p,P,E===!0?1:2),p+=P}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new ao(t.radiusTop,t.radiusBottom,t.height,t.radialSegments,t.heightSegments,t.openEnded,t.thetaStart,t.thetaLength)}}class qa extends We{constructor(t=1,e=32,n=16,s=0,r=Math.PI*2,o=0,a=Math.PI){super(),this.type="SphereGeometry",this.parameters={radius:t,widthSegments:e,heightSegments:n,phiStart:s,phiLength:r,thetaStart:o,thetaLength:a},e=Math.max(3,Math.floor(e)),n=Math.max(2,Math.floor(n));const l=Math.min(o+a,Math.PI);let c=0;const h=[],f=new I,u=new I,d=[],g=[],_=[],m=[];for(let p=0;p<=n;p++){const M=[],x=p/n;let E=0;p===0&&o===0?E=.5/e:p===n&&l===Math.PI&&(E=-.5/e);for(let A=0;A<=e;A++){const b=A/e;f.x=-t*Math.cos(s+b*r)*Math.sin(o+x*a),f.y=t*Math.cos(o+x*a),f.z=t*Math.sin(s+b*r)*Math.sin(o+x*a),g.push(f.x,f.y,f.z),u.copy(f).normalize(),_.push(u.x,u.y,u.z),m.push(b+E,1-x),M.push(c++)}h.push(M)}for(let p=0;p<n;p++)for(let M=0;M<e;M++){const x=h[p][M+1],E=h[p][M],A=h[p+1][M],b=h[p+1][M+1];(p!==0||o>0)&&d.push(x,E,b),(p!==n-1||l<Math.PI)&&d.push(E,A,b)}this.setIndex(d),this.setAttribute("position",new Ve(g,3)),this.setAttribute("normal",new Ve(_,3)),this.setAttribute("uv",new Ve(m,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new qa(t.radius,t.widthSegments,t.heightSegments,t.phiStart,t.phiLength,t.thetaStart,t.thetaLength)}}class si extends Ts{constructor(t){super(),this.isMeshLambertMaterial=!0,this.type="MeshLambertMaterial",this.color=new jt(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new jt(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=bu,this.normalScale=new At(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Rn,this.combine=ka,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.emissive.copy(t.emissive),this.emissiveMap=t.emissiveMap,this.emissiveIntensity=t.emissiveIntensity,this.bumpMap=t.bumpMap,this.bumpScale=t.bumpScale,this.normalMap=t.normalMap,this.normalMapType=t.normalMapType,this.normalScale.copy(t.normalScale),this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.specularMap=t.specularMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.envMapRotation.copy(t.envMapRotation),this.combine=t.combine,this.reflectivity=t.reflectivity,this.refractionRatio=t.refractionRatio,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.flatShading=t.flatShading,this.fog=t.fog,this}}class Yu extends Ae{constructor(t,e=1){super(),this.isLight=!0,this.type="Light",this.color=new jt(t),this.intensity=e}dispose(){}copy(t,e){return super.copy(t,e),this.color.copy(t.color),this.intensity=t.intensity,this}toJSON(t){const e=super.toJSON(t);return e.object.color=this.color.getHex(),e.object.intensity=this.intensity,this.groundColor!==void 0&&(e.object.groundColor=this.groundColor.getHex()),this.distance!==void 0&&(e.object.distance=this.distance),this.angle!==void 0&&(e.object.angle=this.angle),this.decay!==void 0&&(e.object.decay=this.decay),this.penumbra!==void 0&&(e.object.penumbra=this.penumbra),this.shadow!==void 0&&(e.object.shadow=this.shadow.toJSON()),e}}const ea=new Kt,Sc=new I,yc=new I;class k_{constructor(t){this.camera=t,this.bias=0,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new At(512,512),this.map=null,this.mapPass=null,this.matrix=new Kt,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new Va,this._frameExtents=new At(1,1),this._viewportCount=1,this._viewports=[new Ee(0,0,1,1)]}getViewportCount(){return this._viewportCount}getFrustum(){return this._frustum}updateMatrices(t){const e=this.camera,n=this.matrix;Sc.setFromMatrixPosition(t.matrixWorld),e.position.copy(Sc),yc.setFromMatrixPosition(t.target.matrixWorld),e.lookAt(yc),e.updateMatrixWorld(),ea.multiplyMatrices(e.projectionMatrix,e.matrixWorldInverse),this._frustum.setFromProjectionMatrix(ea),n.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),n.multiply(ea)}getViewport(t){return this._viewports[t]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(t){return this.camera=t.camera.clone(),this.bias=t.bias,this.radius=t.radius,this.mapSize.copy(t.mapSize),this}clone(){return new this.constructor().copy(this)}toJSON(){const t={};return this.bias!==0&&(t.bias=this.bias),this.normalBias!==0&&(t.normalBias=this.normalBias),this.radius!==1&&(t.radius=this.radius),(this.mapSize.x!==512||this.mapSize.y!==512)&&(t.mapSize=this.mapSize.toArray()),t.camera=this.camera.toJSON(!1).object,delete t.camera.matrix,t}}class H_ extends k_{constructor(){super(new Bu(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}}class G_ extends Yu{constructor(t,e){super(t,e),this.isDirectionalLight=!0,this.type="DirectionalLight",this.position.copy(Ae.DEFAULT_UP),this.updateMatrix(),this.target=new Ae,this.shadow=new H_}dispose(){this.shadow.dispose()}copy(t){return super.copy(t),this.target=t.target.clone(),this.shadow=t.shadow.clone(),this}}class V_ extends Yu{constructor(t,e){super(t,e),this.isAmbientLight=!0,this.type="AmbientLight"}}class W_{constructor(t=!0){this.autoStart=t,this.startTime=0,this.oldTime=0,this.elapsedTime=0,this.running=!1}start(){this.startTime=Ec(),this.oldTime=this.startTime,this.elapsedTime=0,this.running=!0}stop(){this.getElapsedTime(),this.running=!1,this.autoStart=!1}getElapsedTime(){return this.getDelta(),this.elapsedTime}getDelta(){let t=0;if(this.autoStart&&!this.running)return this.start(),0;if(this.running){const e=Ec();t=(e-this.oldTime)/1e3,this.oldTime=e,this.elapsedTime+=t}return t}}function Ec(){return(typeof performance>"u"?Date:performance).now()}const Tc=new Kt;class ju{constructor(t,e,n=0,s=1/0){this.ray=new Js(t,e),this.near=n,this.far=s,this.camera=null,this.layers=new Ga,this.params={Mesh:{},Line:{threshold:1},LOD:{},Points:{threshold:1},Sprite:{}}}set(t,e){this.ray.set(t,e)}setFromCamera(t,e){e.isPerspectiveCamera?(this.ray.origin.setFromMatrixPosition(e.matrixWorld),this.ray.direction.set(t.x,t.y,.5).unproject(e).sub(this.ray.origin).normalize(),this.camera=e):e.isOrthographicCamera?(this.ray.origin.set(t.x,t.y,(e.near+e.far)/(e.near-e.far)).unproject(e),this.ray.direction.set(0,0,-1).transformDirection(e.matrixWorld),this.camera=e):console.error("THREE.Raycaster: Unsupported camera type: "+e.type)}setFromXRController(t){return Tc.identity().extractRotation(t.matrixWorld),this.ray.origin.setFromMatrixPosition(t.matrixWorld),this.ray.direction.set(0,0,-1).applyMatrix4(Tc),this}intersectObject(t,e=!0,n=[]){return Ra(t,this,n,e),n.sort(bc),n}intersectObjects(t,e=!0,n=[]){for(let s=0,r=t.length;s<r;s++)Ra(t[s],this,n,e);return n.sort(bc),n}}function bc(i,t){return i.distance-t.distance}function Ra(i,t,e,n){let s=!0;if(i.layers.test(t.layers)&&i.raycast(t,e)===!1&&(s=!1),s===!0&&n===!0){const r=i.children;for(let o=0,a=r.length;o<a;o++)Ra(r[o],t,e,!0)}}class Ac{constructor(t=1,e=0,n=0){return this.radius=t,this.phi=e,this.theta=n,this}set(t,e,n){return this.radius=t,this.phi=e,this.theta=n,this}copy(t){return this.radius=t.radius,this.phi=t.phi,this.theta=t.theta,this}makeSafe(){return this.phi=Math.max(1e-6,Math.min(Math.PI-1e-6,this.phi)),this}setFromVector3(t){return this.setFromCartesianCoords(t.x,t.y,t.z)}setFromCartesianCoords(t,e,n){return this.radius=Math.sqrt(t*t+e*e+n*n),this.radius===0?(this.theta=0,this.phi=0):(this.theta=Math.atan2(t,n),this.phi=Math.acos(Le(e/this.radius,-1,1))),this}clone(){return new this.constructor().copy(this)}}const wc=new I,br=new I;class Hn{constructor(t=new I,e=new I){this.start=t,this.end=e}set(t,e){return this.start.copy(t),this.end.copy(e),this}copy(t){return this.start.copy(t.start),this.end.copy(t.end),this}getCenter(t){return t.addVectors(this.start,this.end).multiplyScalar(.5)}delta(t){return t.subVectors(this.end,this.start)}distanceSq(){return this.start.distanceToSquared(this.end)}distance(){return this.start.distanceTo(this.end)}at(t,e){return this.delta(e).multiplyScalar(t).add(this.start)}closestPointToPointParameter(t,e){wc.subVectors(t,this.start),br.subVectors(this.end,this.start);const n=br.dot(br);let r=br.dot(wc)/n;return e&&(r=Le(r,0,1)),r}closestPointToPoint(t,e,n){const s=this.closestPointToPointParameter(t,e);return this.delta(n).multiplyScalar(s).add(this.start)}applyMatrix4(t){return this.start.applyMatrix4(t),this.end.applyMatrix4(t),this}equals(t){return t.start.equals(this.start)&&t.end.equals(this.end)}clone(){return new this.constructor().copy(this)}}typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:Ba}}));typeof window<"u"&&(window.__THREE__?console.warn("WARNING: Multiple instances of Three.js being imported."):window.__THREE__=Ba);const Rc={type:"change"},na={type:"start"},Cc={type:"end"},Ar=new Js,Pc=new _n,X_=Math.cos(70*Rf.DEG2RAD);class q_ extends Di{constructor(t,e){super(),this.object=t,this.domElement=e,this.domElement.style.touchAction="none",this.enabled=!0,this.target=new I,this.cursor=new I,this.minDistance=0,this.maxDistance=1/0,this.minZoom=0,this.maxZoom=1/0,this.minTargetRadius=0,this.maxTargetRadius=1/0,this.minPolarAngle=0,this.maxPolarAngle=Math.PI,this.minAzimuthAngle=-1/0,this.maxAzimuthAngle=1/0,this.enableDamping=!1,this.dampingFactor=.05,this.enableZoom=!0,this.zoomSpeed=1,this.enableRotate=!0,this.rotateSpeed=1,this.enablePan=!0,this.panSpeed=1,this.screenSpacePanning=!0,this.keyPanSpeed=7,this.zoomToCursor=!1,this.autoRotate=!1,this.autoRotateSpeed=2,this.keys={LEFT:"ArrowLeft",UP:"ArrowUp",RIGHT:"ArrowRight",BOTTOM:"ArrowDown"},this.mouseButtons={LEFT:Ii.ROTATE,MIDDLE:Ii.DOLLY,RIGHT:Ii.PAN},this.touches={ONE:Ni.ROTATE,TWO:Ni.DOLLY_PAN},this.target0=this.target.clone(),this.position0=this.object.position.clone(),this.zoom0=this.object.zoom,this._domElementKeyEvents=null,this.getPolarAngle=function(){return a.phi},this.getAzimuthalAngle=function(){return a.theta},this.getDistance=function(){return this.object.position.distanceTo(this.target)},this.listenToKeyEvents=function(y){y.addEventListener("keydown",at),this._domElementKeyEvents=y},this.stopListenToKeyEvents=function(){this._domElementKeyEvents.removeEventListener("keydown",at),this._domElementKeyEvents=null},this.saveState=function(){n.target0.copy(n.target),n.position0.copy(n.object.position),n.zoom0=n.object.zoom},this.reset=function(){n.target.copy(n.target0),n.object.position.copy(n.position0),n.object.zoom=n.zoom0,n.object.updateProjectionMatrix(),n.dispatchEvent(Rc),n.update(),r=s.NONE},this.update=function(){const y=new I,q=new Ci().setFromUnitVectors(t.up,new I(0,1,0)),G=q.clone().invert(),j=new I,Q=new Ci,Mt=new I,St=2*Math.PI;return function(ce=null){const Yt=n.object.position;y.copy(Yt).sub(n.target),y.applyQuaternion(q),a.setFromVector3(y),n.autoRotate&&r===s.NONE&&L(v(ce)),n.enableDamping?(a.theta+=l.theta*n.dampingFactor,a.phi+=l.phi*n.dampingFactor):(a.theta+=l.theta,a.phi+=l.phi);let le=n.minAzimuthAngle,ue=n.maxAzimuthAngle;isFinite(le)&&isFinite(ue)&&(le<-Math.PI?le+=St:le>Math.PI&&(le-=St),ue<-Math.PI?ue+=St:ue>Math.PI&&(ue-=St),le<=ue?a.theta=Math.max(le,Math.min(ue,a.theta)):a.theta=a.theta>(le+ue)/2?Math.max(le,a.theta):Math.min(ue,a.theta)),a.phi=Math.max(n.minPolarAngle,Math.min(n.maxPolarAngle,a.phi)),a.makeSafe(),n.enableDamping===!0?n.target.addScaledVector(h,n.dampingFactor):n.target.add(h),n.target.sub(n.cursor),n.target.clampLength(n.minTargetRadius,n.maxTargetRadius),n.target.add(n.cursor);let we=!1;if(n.zoomToCursor&&b||n.object.isOrthographicCamera)a.radius=st(a.radius);else{const Te=a.radius;a.radius=st(a.radius*c),we=Te!=a.radius}if(y.setFromSpherical(a),y.applyQuaternion(G),Yt.copy(n.target).add(y),n.object.lookAt(n.target),n.enableDamping===!0?(l.theta*=1-n.dampingFactor,l.phi*=1-n.dampingFactor,h.multiplyScalar(1-n.dampingFactor)):(l.set(0,0,0),h.set(0,0,0)),n.zoomToCursor&&b){let Te=null;if(n.object.isPerspectiveCamera){const Qe=y.length();Te=st(Qe*c);const Mn=Qe-Te;n.object.position.addScaledVector(E,Mn),n.object.updateMatrixWorld(),we=!!Mn}else if(n.object.isOrthographicCamera){const Qe=new I(A.x,A.y,0);Qe.unproject(n.object);const Mn=n.object.zoom;n.object.zoom=Math.max(n.minZoom,Math.min(n.maxZoom,n.object.zoom/c)),n.object.updateProjectionMatrix(),we=Mn!==n.object.zoom;const he=new I(A.x,A.y,0);he.unproject(n.object),n.object.position.sub(he).add(Qe),n.object.updateMatrixWorld(),Te=y.length()}else console.warn("WARNING: OrbitControls.js encountered an unknown camera type - zoom to cursor disabled."),n.zoomToCursor=!1;Te!==null&&(this.screenSpacePanning?n.target.set(0,0,-1).transformDirection(n.object.matrix).multiplyScalar(Te).add(n.object.position):(Ar.origin.copy(n.object.position),Ar.direction.set(0,0,-1).transformDirection(n.object.matrix),Math.abs(n.object.up.dot(Ar.direction))<X_?t.lookAt(n.target):(Pc.setFromNormalAndCoplanarPoint(n.object.up,n.target),Ar.intersectPlane(Pc,n.target))))}else if(n.object.isOrthographicCamera){const Te=n.object.zoom;n.object.zoom=Math.max(n.minZoom,Math.min(n.maxZoom,n.object.zoom/c)),Te!==n.object.zoom&&(n.object.updateProjectionMatrix(),we=!0)}return c=1,b=!1,we||j.distanceToSquared(n.object.position)>o||8*(1-Q.dot(n.object.quaternion))>o||Mt.distanceToSquared(n.target)>o?(n.dispatchEvent(Rc),j.copy(n.object.position),Q.copy(n.object.quaternion),Mt.copy(n.target),!0):!1}}(),this.dispose=function(){n.domElement.removeEventListener("contextmenu",mt),n.domElement.removeEventListener("pointerdown",$t),n.domElement.removeEventListener("pointercancel",w),n.domElement.removeEventListener("wheel",tt),n.domElement.removeEventListener("pointermove",U),n.domElement.removeEventListener("pointerup",w),n.domElement.getRootNode().removeEventListener("keydown",vt,{capture:!0}),n._domElementKeyEvents!==null&&(n._domElementKeyEvents.removeEventListener("keydown",at),n._domElementKeyEvents=null)};const n=this,s={NONE:-1,ROTATE:0,DOLLY:1,PAN:2,TOUCH_ROTATE:3,TOUCH_PAN:4,TOUCH_DOLLY_PAN:5,TOUCH_DOLLY_ROTATE:6};let r=s.NONE;const o=1e-6,a=new Ac,l=new Ac;let c=1;const h=new I,f=new At,u=new At,d=new At,g=new At,_=new At,m=new At,p=new At,M=new At,x=new At,E=new I,A=new At;let b=!1;const S=[],P={};let T=!1;function v(y){return y!==null?2*Math.PI/60*n.autoRotateSpeed*y:2*Math.PI/60/60*n.autoRotateSpeed}function R(y){const q=Math.abs(y*.01);return Math.pow(.95,n.zoomSpeed*q)}function L(y){l.theta-=y}function D(y){l.phi-=y}const N=function(){const y=new I;return function(G,j){y.setFromMatrixColumn(j,0),y.multiplyScalar(-G),h.add(y)}}(),z=function(){const y=new I;return function(G,j){n.screenSpacePanning===!0?y.setFromMatrixColumn(j,1):(y.setFromMatrixColumn(j,0),y.crossVectors(n.object.up,y)),y.multiplyScalar(G),h.add(y)}}(),O=function(){const y=new I;return function(G,j){const Q=n.domElement;if(n.object.isPerspectiveCamera){const Mt=n.object.position;y.copy(Mt).sub(n.target);let St=y.length();St*=Math.tan(n.object.fov/2*Math.PI/180),N(2*G*St/Q.clientHeight,n.object.matrix),z(2*j*St/Q.clientHeight,n.object.matrix)}else n.object.isOrthographicCamera?(N(G*(n.object.right-n.object.left)/n.object.zoom/Q.clientWidth,n.object.matrix),z(j*(n.object.top-n.object.bottom)/n.object.zoom/Q.clientHeight,n.object.matrix)):(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - pan disabled."),n.enablePan=!1)}}();function Y(y){n.object.isPerspectiveCamera||n.object.isOrthographicCamera?c/=y:(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."),n.enableZoom=!1)}function B(y){n.object.isPerspectiveCamera||n.object.isOrthographicCamera?c*=y:(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."),n.enableZoom=!1)}function it(y,q){if(!n.zoomToCursor)return;b=!0;const G=n.domElement.getBoundingClientRect(),j=y-G.left,Q=q-G.top,Mt=G.width,St=G.height;A.x=j/Mt*2-1,A.y=-(Q/St)*2+1,E.set(A.x,A.y,1).unproject(n.object).sub(n.object.position).normalize()}function st(y){return Math.max(n.minDistance,Math.min(n.maxDistance,y))}function ht(y){f.set(y.clientX,y.clientY)}function Pt(y){it(y.clientX,y.clientX),p.set(y.clientX,y.clientY)}function Wt(y){g.set(y.clientX,y.clientY)}function K(y){u.set(y.clientX,y.clientY),d.subVectors(u,f).multiplyScalar(n.rotateSpeed);const q=n.domElement;L(2*Math.PI*d.x/q.clientHeight),D(2*Math.PI*d.y/q.clientHeight),f.copy(u),n.update()}function et(y){M.set(y.clientX,y.clientY),x.subVectors(M,p),x.y>0?Y(R(x.y)):x.y<0&&B(R(x.y)),p.copy(M),n.update()}function pt(y){_.set(y.clientX,y.clientY),m.subVectors(_,g).multiplyScalar(n.panSpeed),O(m.x,m.y),g.copy(_),n.update()}function lt(y){it(y.clientX,y.clientY),y.deltaY<0?B(R(y.deltaY)):y.deltaY>0&&Y(R(y.deltaY)),n.update()}function Ot(y){let q=!1;switch(y.code){case n.keys.UP:y.ctrlKey||y.metaKey||y.shiftKey?D(2*Math.PI*n.rotateSpeed/n.domElement.clientHeight):O(0,n.keyPanSpeed),q=!0;break;case n.keys.BOTTOM:y.ctrlKey||y.metaKey||y.shiftKey?D(-2*Math.PI*n.rotateSpeed/n.domElement.clientHeight):O(0,-n.keyPanSpeed),q=!0;break;case n.keys.LEFT:y.ctrlKey||y.metaKey||y.shiftKey?L(2*Math.PI*n.rotateSpeed/n.domElement.clientHeight):O(n.keyPanSpeed,0),q=!0;break;case n.keys.RIGHT:y.ctrlKey||y.metaKey||y.shiftKey?L(-2*Math.PI*n.rotateSpeed/n.domElement.clientHeight):O(-n.keyPanSpeed,0),q=!0;break}q&&(y.preventDefault(),n.update())}function Rt(y){if(S.length===1)f.set(y.pageX,y.pageY);else{const q=Tt(y),G=.5*(y.pageX+q.x),j=.5*(y.pageY+q.y);f.set(G,j)}}function Xt(y){if(S.length===1)g.set(y.pageX,y.pageY);else{const q=Tt(y),G=.5*(y.pageX+q.x),j=.5*(y.pageY+q.y);g.set(G,j)}}function F(y){const q=Tt(y),G=y.pageX-q.x,j=y.pageY-q.y,Q=Math.sqrt(G*G+j*j);p.set(0,Q)}function qt(y){n.enableZoom&&F(y),n.enablePan&&Xt(y)}function zt(y){n.enableZoom&&F(y),n.enableRotate&&Rt(y)}function Qt(y){if(S.length==1)u.set(y.pageX,y.pageY);else{const G=Tt(y),j=.5*(y.pageX+G.x),Q=.5*(y.pageY+G.y);u.set(j,Q)}d.subVectors(u,f).multiplyScalar(n.rotateSpeed);const q=n.domElement;L(2*Math.PI*d.x/q.clientHeight),D(2*Math.PI*d.y/q.clientHeight),f.copy(u)}function _t(y){if(S.length===1)_.set(y.pageX,y.pageY);else{const q=Tt(y),G=.5*(y.pageX+q.x),j=.5*(y.pageY+q.y);_.set(G,j)}m.subVectors(_,g).multiplyScalar(n.panSpeed),O(m.x,m.y),g.copy(_)}function Ht(y){const q=Tt(y),G=y.pageX-q.x,j=y.pageY-q.y,Q=Math.sqrt(G*G+j*j);M.set(0,Q),x.set(0,Math.pow(M.y/p.y,n.zoomSpeed)),Y(x.y),p.copy(M);const Mt=(y.pageX+q.x)*.5,St=(y.pageY+q.y)*.5;it(Mt,St)}function Bt(y){n.enableZoom&&Ht(y),n.enablePan&&_t(y)}function wt(y){n.enableZoom&&Ht(y),n.enableRotate&&Qt(y)}function $t(y){n.enabled!==!1&&(S.length===0&&(n.domElement.setPointerCapture(y.pointerId),n.domElement.addEventListener("pointermove",U),n.domElement.addEventListener("pointerup",w)),!ct(y)&&(kt(y),y.pointerType==="touch"?Ut(y):X(y)))}function U(y){n.enabled!==!1&&(y.pointerType==="touch"?nt(y):Z(y))}function w(y){switch(Et(y),S.length){case 0:n.domElement.releasePointerCapture(y.pointerId),n.domElement.removeEventListener("pointermove",U),n.domElement.removeEventListener("pointerup",w),n.dispatchEvent(Cc),r=s.NONE;break;case 1:const q=S[0],G=P[q];Ut({pointerId:q,pageX:G.x,pageY:G.y});break}}function X(y){let q;switch(y.button){case 0:q=n.mouseButtons.LEFT;break;case 1:q=n.mouseButtons.MIDDLE;break;case 2:q=n.mouseButtons.RIGHT;break;default:q=-1}switch(q){case Ii.DOLLY:if(n.enableZoom===!1)return;Pt(y),r=s.DOLLY;break;case Ii.ROTATE:if(y.ctrlKey||y.metaKey||y.shiftKey){if(n.enablePan===!1)return;Wt(y),r=s.PAN}else{if(n.enableRotate===!1)return;ht(y),r=s.ROTATE}break;case Ii.PAN:if(y.ctrlKey||y.metaKey||y.shiftKey){if(n.enableRotate===!1)return;ht(y),r=s.ROTATE}else{if(n.enablePan===!1)return;Wt(y),r=s.PAN}break;default:r=s.NONE}r!==s.NONE&&n.dispatchEvent(na)}function Z(y){switch(r){case s.ROTATE:if(n.enableRotate===!1)return;K(y);break;case s.DOLLY:if(n.enableZoom===!1)return;et(y);break;case s.PAN:if(n.enablePan===!1)return;pt(y);break}}function tt(y){n.enabled===!1||n.enableZoom===!1||r!==s.NONE||(y.preventDefault(),n.dispatchEvent(na),lt(J(y)),n.dispatchEvent(Cc))}function J(y){const q=y.deltaMode,G={clientX:y.clientX,clientY:y.clientY,deltaY:y.deltaY};switch(q){case 1:G.deltaY*=16;break;case 2:G.deltaY*=100;break}return y.ctrlKey&&!T&&(G.deltaY*=10),G}function vt(y){y.key==="Control"&&(T=!0,n.domElement.getRootNode().addEventListener("keyup",ot,{passive:!0,capture:!0}))}function ot(y){y.key==="Control"&&(T=!1,n.domElement.getRootNode().removeEventListener("keyup",ot,{passive:!0,capture:!0}))}function at(y){n.enabled===!1||n.enablePan===!1||Ot(y)}function Ut(y){switch(It(y),S.length){case 1:switch(n.touches.ONE){case Ni.ROTATE:if(n.enableRotate===!1)return;Rt(y),r=s.TOUCH_ROTATE;break;case Ni.PAN:if(n.enablePan===!1)return;Xt(y),r=s.TOUCH_PAN;break;default:r=s.NONE}break;case 2:switch(n.touches.TWO){case Ni.DOLLY_PAN:if(n.enableZoom===!1&&n.enablePan===!1)return;qt(y),r=s.TOUCH_DOLLY_PAN;break;case Ni.DOLLY_ROTATE:if(n.enableZoom===!1&&n.enableRotate===!1)return;zt(y),r=s.TOUCH_DOLLY_ROTATE;break;default:r=s.NONE}break;default:r=s.NONE}r!==s.NONE&&n.dispatchEvent(na)}function nt(y){switch(It(y),r){case s.TOUCH_ROTATE:if(n.enableRotate===!1)return;Qt(y),n.update();break;case s.TOUCH_PAN:if(n.enablePan===!1)return;_t(y),n.update();break;case s.TOUCH_DOLLY_PAN:if(n.enableZoom===!1&&n.enablePan===!1)return;Bt(y),n.update();break;case s.TOUCH_DOLLY_ROTATE:if(n.enableZoom===!1&&n.enableRotate===!1)return;wt(y),n.update();break;default:r=s.NONE}}function mt(y){n.enabled!==!1&&y.preventDefault()}function kt(y){S.push(y.pointerId)}function Et(y){delete P[y.pointerId];for(let q=0;q<S.length;q++)if(S[q]==y.pointerId){S.splice(q,1);return}}function ct(y){for(let q=0;q<S.length;q++)if(S[q]==y.pointerId)return!0;return!1}function It(y){let q=P[y.pointerId];q===void 0&&(q=new At,P[y.pointerId]=q),q.set(y.pageX,y.pageY)}function Tt(y){const q=y.pointerId===S[0]?S[1]:S[0];return P[q]}n.domElement.addEventListener("contextmenu",mt),n.domElement.addEventListener("pointerdown",$t),n.domElement.addEventListener("pointercancel",w),n.domElement.addEventListener("wheel",tt,{passive:!1}),n.domElement.getRootNode().addEventListener("keydown",vt,{passive:!0,capture:!0}),this.update()}}const Ku=0,Y_=1,j_=2,Lc=2,ia=1.25,Dc=1,Xs=6*4+4+4,mo=65535,K_=Math.pow(2,-24),sa=Symbol("SKIP_GENERATION");function $_(i){return i.index?i.index.count:i.attributes.position.count}function As(i){return $_(i)/3}function Z_(i,t=ArrayBuffer){return i>65535?new Uint32Array(new t(4*i)):new Uint16Array(new t(2*i))}function J_(i,t){if(!i.index){const e=i.attributes.position.count,n=t.useSharedArrayBuffer?SharedArrayBuffer:ArrayBuffer,s=Z_(e,n);i.setIndex(new Je(s,1));for(let r=0;r<e;r++)s[r]=r}}function $u(i){const t=As(i),e=i.drawRange,n=e.start/3,s=(e.start+e.count)/3,r=Math.max(0,n),o=Math.min(t,s)-r;return[{offset:Math.floor(r),count:Math.floor(o)}]}function Zu(i){if(!i.groups||!i.groups.length)return $u(i);const t=[],e=new Set,n=i.drawRange,s=n.start/3,r=(n.start+n.count)/3;for(const a of i.groups){const l=a.start/3,c=(a.start+a.count)/3;e.add(Math.max(s,l)),e.add(Math.min(r,c))}const o=Array.from(e.values()).sort((a,l)=>a-l);for(let a=0;a<o.length-1;a++){const l=o[a],c=o[a+1];t.push({offset:Math.floor(l),count:Math.floor(c-l)})}return t}function Q_(i){if(i.groups.length===0)return!1;const t=As(i),e=Zu(i).sort((r,o)=>r.offset-o.offset),n=e[e.length-1];n.count=Math.min(t-n.offset,n.count);let s=0;return e.forEach(({count:r})=>s+=r),t!==s}function ra(i,t,e,n,s){let r=1/0,o=1/0,a=1/0,l=-1/0,c=-1/0,h=-1/0,f=1/0,u=1/0,d=1/0,g=-1/0,_=-1/0,m=-1/0;for(let p=t*6,M=(t+e)*6;p<M;p+=6){const x=i[p+0],E=i[p+1],A=x-E,b=x+E;A<r&&(r=A),b>l&&(l=b),x<f&&(f=x),x>g&&(g=x);const S=i[p+2],P=i[p+3],T=S-P,v=S+P;T<o&&(o=T),v>c&&(c=v),S<u&&(u=S),S>_&&(_=S);const R=i[p+4],L=i[p+5],D=R-L,N=R+L;D<a&&(a=D),N>h&&(h=N),R<d&&(d=R),R>m&&(m=R)}n[0]=r,n[1]=o,n[2]=a,n[3]=l,n[4]=c,n[5]=h,s[0]=f,s[1]=u,s[2]=d,s[3]=g,s[4]=_,s[5]=m}function t0(i,t=null,e=null,n=null){const s=i.attributes.position,r=i.index?i.index.array:null,o=As(i),a=s.normalized;let l;t===null?(l=new Float32Array(o*6*4),e=0,n=o):(l=t,e=e||0,n=n||o);const c=s.array,h=s.offset||0;let f=3;s.isInterleavedBufferAttribute&&(f=s.data.stride);const u=["getX","getY","getZ"];for(let d=e;d<e+n;d++){const g=d*3,_=d*6;let m=g+0,p=g+1,M=g+2;r&&(m=r[m],p=r[p],M=r[M]),a||(m=m*f+h,p=p*f+h,M=M*f+h);for(let x=0;x<3;x++){let E,A,b;a?(E=s[u[x]](m),A=s[u[x]](p),b=s[u[x]](M)):(E=c[m+x],A=c[p+x],b=c[M+x]);let S=E;A<S&&(S=A),b<S&&(S=b);let P=E;A>P&&(P=A),b>P&&(P=b);const T=(P-S)/2,v=x*2;l[_+v+0]=S+T,l[_+v+1]=T+(Math.abs(S)+T)*K_}}return l}function pe(i,t,e){return e.min.x=t[i],e.min.y=t[i+1],e.min.z=t[i+2],e.max.x=t[i+3],e.max.y=t[i+4],e.max.z=t[i+5],e}function Uc(i){let t=-1,e=-1/0;for(let n=0;n<3;n++){const s=i[n+3]-i[n];s>e&&(e=s,t=n)}return t}function Ic(i,t){t.set(i)}function Nc(i,t,e){let n,s;for(let r=0;r<3;r++){const o=r+3;n=i[r],s=t[r],e[r]=n<s?n:s,n=i[o],s=t[o],e[o]=n>s?n:s}}function wr(i,t,e){for(let n=0;n<3;n++){const s=t[i+2*n],r=t[i+2*n+1],o=s-r,a=s+r;o<e[n]&&(e[n]=o),a>e[n+3]&&(e[n+3]=a)}}function Us(i){const t=i[3]-i[0],e=i[4]-i[1],n=i[5]-i[2];return 2*(t*e+e*n+n*t)}const zn=32,e0=(i,t)=>i.candidate-t.candidate,Zn=new Array(zn).fill().map(()=>({count:0,bounds:new Float32Array(6),rightCacheBounds:new Float32Array(6),leftCacheBounds:new Float32Array(6),candidate:0})),Rr=new Float32Array(6);function n0(i,t,e,n,s,r){let o=-1,a=0;if(r===Ku)o=Uc(t),o!==-1&&(a=(t[o]+t[o+3])/2);else if(r===Y_)o=Uc(i),o!==-1&&(a=i0(e,n,s,o));else if(r===j_){const l=Us(i);let c=ia*s;const h=n*6,f=(n+s)*6;for(let u=0;u<3;u++){const d=t[u],m=(t[u+3]-d)/zn;if(s<zn/4){const p=[...Zn];p.length=s;let M=0;for(let E=h;E<f;E+=6,M++){const A=p[M];A.candidate=e[E+2*u],A.count=0;const{bounds:b,leftCacheBounds:S,rightCacheBounds:P}=A;for(let T=0;T<3;T++)P[T]=1/0,P[T+3]=-1/0,S[T]=1/0,S[T+3]=-1/0,b[T]=1/0,b[T+3]=-1/0;wr(E,e,b)}p.sort(e0);let x=s;for(let E=0;E<x;E++){const A=p[E];for(;E+1<x&&p[E+1].candidate===A.candidate;)p.splice(E+1,1),x--}for(let E=h;E<f;E+=6){const A=e[E+2*u];for(let b=0;b<x;b++){const S=p[b];A>=S.candidate?wr(E,e,S.rightCacheBounds):(wr(E,e,S.leftCacheBounds),S.count++)}}for(let E=0;E<x;E++){const A=p[E],b=A.count,S=s-A.count,P=A.leftCacheBounds,T=A.rightCacheBounds;let v=0;b!==0&&(v=Us(P)/l);let R=0;S!==0&&(R=Us(T)/l);const L=Dc+ia*(v*b+R*S);L<c&&(o=u,c=L,a=A.candidate)}}else{for(let x=0;x<zn;x++){const E=Zn[x];E.count=0,E.candidate=d+m+x*m;const A=E.bounds;for(let b=0;b<3;b++)A[b]=1/0,A[b+3]=-1/0}for(let x=h;x<f;x+=6){let b=~~((e[x+2*u]-d)/m);b>=zn&&(b=zn-1);const S=Zn[b];S.count++,wr(x,e,S.bounds)}const p=Zn[zn-1];Ic(p.bounds,p.rightCacheBounds);for(let x=zn-2;x>=0;x--){const E=Zn[x],A=Zn[x+1];Nc(E.bounds,A.rightCacheBounds,E.rightCacheBounds)}let M=0;for(let x=0;x<zn-1;x++){const E=Zn[x],A=E.count,b=E.bounds,P=Zn[x+1].rightCacheBounds;A!==0&&(M===0?Ic(b,Rr):Nc(b,Rr,Rr)),M+=A;let T=0,v=0;M!==0&&(T=Us(Rr)/l);const R=s-M;R!==0&&(v=Us(P)/l);const L=Dc+ia*(T*M+v*R);L<c&&(o=u,c=L,a=E.candidate)}}}}else console.warn(`MeshBVH: Invalid build strategy value ${r} used.`);return{axis:o,pos:a}}function i0(i,t,e,n){let s=0;for(let r=t,o=t+e;r<o;r++)s+=i[r*6+n*2];return s/e}class oa{constructor(){this.boundingData=new Float32Array(6)}}function s0(i,t,e,n,s,r){let o=n,a=n+s-1;const l=r.pos,c=r.axis*2;for(;;){for(;o<=a&&e[o*6+c]<l;)o++;for(;o<=a&&e[a*6+c]>=l;)a--;if(o<a){for(let h=0;h<3;h++){let f=t[o*3+h];t[o*3+h]=t[a*3+h],t[a*3+h]=f}for(let h=0;h<6;h++){let f=e[o*6+h];e[o*6+h]=e[a*6+h],e[a*6+h]=f}o++,a--}else return o}}function r0(i,t,e,n,s,r){let o=n,a=n+s-1;const l=r.pos,c=r.axis*2;for(;;){for(;o<=a&&e[o*6+c]<l;)o++;for(;o<=a&&e[a*6+c]>=l;)a--;if(o<a){let h=i[o];i[o]=i[a],i[a]=h;for(let f=0;f<6;f++){let u=e[o*6+f];e[o*6+f]=e[a*6+f],e[a*6+f]=u}o++,a--}else return o}}function He(i,t){return t[i+15]===65535}function $e(i,t){return t[i+6]}function on(i,t){return t[i+14]}function an(i){return i+8}function ln(i,t){return t[i+6]}function Ju(i,t){return t[i+7]}let Qu,ks,Xr,th;const o0=Math.pow(2,32);function Ca(i){return"count"in i?1:1+Ca(i.left)+Ca(i.right)}function a0(i,t,e){return Qu=new Float32Array(e),ks=new Uint32Array(e),Xr=new Uint16Array(e),th=new Uint8Array(e),Pa(i,t)}function Pa(i,t){const e=i/4,n=i/2,s="count"in t,r=t.boundingData;for(let o=0;o<6;o++)Qu[e+o]=r[o];if(s)if(t.buffer){const o=t.buffer;th.set(new Uint8Array(o),i);for(let a=i,l=i+o.byteLength;a<l;a+=Xs){const c=a/2;He(c,Xr)||(ks[a/4+6]+=e)}return i+o.byteLength}else{const o=t.offset,a=t.count;return ks[e+6]=o,Xr[n+14]=a,Xr[n+15]=mo,i+Xs}else{const o=t.left,a=t.right,l=t.splitAxis;let c;if(c=Pa(i+Xs,o),c/4>o0)throw new Error("MeshBVH: Cannot store child pointer greater than 32 bits.");return ks[e+6]=c/4,c=Pa(c,a),ks[e+7]=l,c}}function l0(i,t){const e=(i.index?i.index.count:i.attributes.position.count)/3,n=e>2**16,s=n?4:2,r=t?new SharedArrayBuffer(e*s):new ArrayBuffer(e*s),o=n?new Uint32Array(r):new Uint16Array(r);for(let a=0,l=o.length;a<l;a++)o[a]=a;return o}function c0(i,t,e,n,s){const{maxDepth:r,verbose:o,maxLeafTris:a,strategy:l,onProgress:c,indirect:h}=s,f=i._indirectBuffer,u=i.geometry,d=u.index?u.index.array:null,g=h?r0:s0,_=As(u),m=new Float32Array(6);let p=!1;const M=new oa;return ra(t,e,n,M.boundingData,m),E(M,e,n,m),M;function x(A){c&&c(A/_)}function E(A,b,S,P=null,T=0){if(!p&&T>=r&&(p=!0,o&&(console.warn(`MeshBVH: Max depth of ${r} reached when generating BVH. Consider increasing maxDepth.`),console.warn(u))),S<=a||T>=r)return x(b+S),A.offset=b,A.count=S,A;const v=n0(A.boundingData,P,t,b,S,l);if(v.axis===-1)return x(b+S),A.offset=b,A.count=S,A;const R=g(f,d,t,b,S,v);if(R===b||R===b+S)x(b+S),A.offset=b,A.count=S;else{A.splitAxis=v.axis;const L=new oa,D=b,N=R-b;A.left=L,ra(t,D,N,L.boundingData,m),E(L,D,N,m,T+1);const z=new oa,O=R,Y=S-N;A.right=z,ra(t,O,Y,z.boundingData,m),E(z,O,Y,m,T+1)}return A}}function u0(i,t){const e=i.geometry;t.indirect&&(i._indirectBuffer=l0(e,t.useSharedArrayBuffer),Q_(e)&&!t.verbose&&console.warn('MeshBVH: Provided geometry contains groups that do not fully span the vertex contents while using the "indirect" option. BVH may incorrectly report intersections on unrendered portions of the geometry.')),i._indirectBuffer||J_(e,t);const n=t.useSharedArrayBuffer?SharedArrayBuffer:ArrayBuffer,s=t0(e),r=t.indirect?$u(e):Zu(e);i._roots=r.map(o=>{const a=c0(i,s,o.offset,o.count,t),l=Ca(a),c=new n(Xs*l);return a0(0,a,c),c})}class Gn{constructor(){this.min=1/0,this.max=-1/0}setFromPointsField(t,e){let n=1/0,s=-1/0;for(let r=0,o=t.length;r<o;r++){const l=t[r][e];n=l<n?l:n,s=l>s?l:s}this.min=n,this.max=s}setFromPoints(t,e){let n=1/0,s=-1/0;for(let r=0,o=e.length;r<o;r++){const a=e[r],l=t.dot(a);n=l<n?l:n,s=l>s?l:s}this.min=n,this.max=s}isSeparated(t){return this.min>t.max||t.min>this.max}}Gn.prototype.setFromBox=function(){const i=new I;return function(e,n){const s=n.min,r=n.max;let o=1/0,a=-1/0;for(let l=0;l<=1;l++)for(let c=0;c<=1;c++)for(let h=0;h<=1;h++){i.x=s.x*l+r.x*(1-l),i.y=s.y*c+r.y*(1-c),i.z=s.z*h+r.z*(1-h);const f=e.dot(i);o=Math.min(f,o),a=Math.max(f,a)}this.min=o,this.max=a}}();const h0=function(){const i=new I,t=new I,e=new I;return function(s,r,o){const a=s.start,l=i,c=r.start,h=t;e.subVectors(a,c),i.subVectors(s.end,s.start),t.subVectors(r.end,r.start);const f=e.dot(h),u=h.dot(l),d=h.dot(h),g=e.dot(l),m=l.dot(l)*d-u*u;let p,M;m!==0?p=(f*u-g*d)/m:p=0,M=(f+p*u)/d,o.x=p,o.y=M}}(),Ya=function(){const i=new At,t=new I,e=new I;return function(s,r,o,a){h0(s,r,i);let l=i.x,c=i.y;if(l>=0&&l<=1&&c>=0&&c<=1){s.at(l,o),r.at(c,a);return}else if(l>=0&&l<=1){c<0?r.at(0,a):r.at(1,a),s.closestPointToPoint(a,!0,o);return}else if(c>=0&&c<=1){l<0?s.at(0,o):s.at(1,o),r.closestPointToPoint(o,!0,a);return}else{let h;l<0?h=s.start:h=s.end;let f;c<0?f=r.start:f=r.end;const u=t,d=e;if(s.closestPointToPoint(f,!0,t),r.closestPointToPoint(h,!0,e),u.distanceToSquared(f)<=d.distanceToSquared(h)){o.copy(u),a.copy(f);return}else{o.copy(h),a.copy(d);return}}}}(),f0=function(){const i=new I,t=new I,e=new _n,n=new Hn;return function(r,o){const{radius:a,center:l}=r,{a:c,b:h,c:f}=o;if(n.start=c,n.end=h,n.closestPointToPoint(l,!0,i).distanceTo(l)<=a||(n.start=c,n.end=f,n.closestPointToPoint(l,!0,i).distanceTo(l)<=a)||(n.start=h,n.end=f,n.closestPointToPoint(l,!0,i).distanceTo(l)<=a))return!0;const _=o.getPlane(e);if(Math.abs(_.distanceToPoint(l))<=a){const p=_.projectPoint(l,t);if(o.containsPoint(p))return!0}return!1}}(),d0=1e-15;function aa(i){return Math.abs(i)<d0}class vn extends Ne{constructor(...t){super(...t),this.isExtendedTriangle=!0,this.satAxes=new Array(4).fill().map(()=>new I),this.satBounds=new Array(4).fill().map(()=>new Gn),this.points=[this.a,this.b,this.c],this.sphere=new Zs,this.plane=new _n,this.needsUpdate=!0}intersectsSphere(t){return f0(t,this)}update(){const t=this.a,e=this.b,n=this.c,s=this.points,r=this.satAxes,o=this.satBounds,a=r[0],l=o[0];this.getNormal(a),l.setFromPoints(a,s);const c=r[1],h=o[1];c.subVectors(t,e),h.setFromPoints(c,s);const f=r[2],u=o[2];f.subVectors(e,n),u.setFromPoints(f,s);const d=r[3],g=o[3];d.subVectors(n,t),g.setFromPoints(d,s),this.sphere.setFromPoints(this.points),this.plane.setFromNormalAndCoplanarPoint(a,t),this.needsUpdate=!1}}vn.prototype.closestPointToSegment=function(){const i=new I,t=new I,e=new Hn;return function(s,r=null,o=null){const{start:a,end:l}=s,c=this.points;let h,f=1/0;for(let u=0;u<3;u++){const d=(u+1)%3;e.start.copy(c[u]),e.end.copy(c[d]),Ya(e,s,i,t),h=i.distanceToSquared(t),h<f&&(f=h,r&&r.copy(i),o&&o.copy(t))}return this.closestPointToPoint(a,i),h=a.distanceToSquared(i),h<f&&(f=h,r&&r.copy(i),o&&o.copy(a)),this.closestPointToPoint(l,i),h=l.distanceToSquared(i),h<f&&(f=h,r&&r.copy(i),o&&o.copy(l)),Math.sqrt(f)}}();vn.prototype.intersectsTriangle=function(){const i=new vn,t=new Array(3),e=new Array(3),n=new Gn,s=new Gn,r=new I,o=new I,a=new I,l=new I,c=new I,h=new Hn,f=new Hn,u=new Hn,d=new I;function g(_,m,p){const M=_.points;let x=0,E=-1;for(let A=0;A<3;A++){const{start:b,end:S}=h;b.copy(M[A]),S.copy(M[(A+1)%3]),h.delta(o);const P=aa(m.distanceToPoint(b));if(aa(m.normal.dot(o))&&P){p.copy(h),x=2;break}const T=m.intersectLine(h,d);if(!T&&P&&d.copy(b),(T||P)&&!aa(d.distanceTo(S))){if(x<=1)(x===1?p.start:p.end).copy(d),P&&(E=x);else if(x>=2){(E===1?p.start:p.end).copy(d),x=2;break}if(x++,x===2&&E===-1)break}}return x}return function(m,p=null,M=!1){this.needsUpdate&&this.update(),m.isExtendedTriangle?m.needsUpdate&&m.update():(i.copy(m),i.update(),m=i);const x=this.plane,E=m.plane;if(Math.abs(x.normal.dot(E.normal))>1-1e-10){const A=this.satBounds,b=this.satAxes;e[0]=m.a,e[1]=m.b,e[2]=m.c;for(let T=0;T<4;T++){const v=A[T],R=b[T];if(n.setFromPoints(R,e),v.isSeparated(n))return!1}const S=m.satBounds,P=m.satAxes;t[0]=this.a,t[1]=this.b,t[2]=this.c;for(let T=0;T<4;T++){const v=S[T],R=P[T];if(n.setFromPoints(R,t),v.isSeparated(n))return!1}for(let T=0;T<4;T++){const v=b[T];for(let R=0;R<4;R++){const L=P[R];if(r.crossVectors(v,L),n.setFromPoints(r,t),s.setFromPoints(r,e),n.isSeparated(s))return!1}}return p&&(M||console.warn("ExtendedTriangle.intersectsTriangle: Triangles are coplanar which does not support an output edge. Setting edge to 0, 0, 0."),p.start.set(0,0,0),p.end.set(0,0,0)),!0}else{const A=g(this,E,f);if(A===1&&m.containsPoint(f.end))return p&&(p.start.copy(f.end),p.end.copy(f.end)),!0;if(A!==2)return!1;const b=g(m,x,u);if(b===1&&this.containsPoint(u.end))return p&&(p.start.copy(u.end),p.end.copy(u.end)),!0;if(b!==2)return!1;if(f.delta(a),u.delta(l),a.dot(l)<0){let D=u.start;u.start=u.end,u.end=D}const S=f.start.dot(a),P=f.end.dot(a),T=u.start.dot(a),v=u.end.dot(a),R=P<T,L=S<v;return S!==v&&T!==P&&R===L?!1:(p&&(c.subVectors(f.start,u.start),c.dot(a)>0?p.start.copy(f.start):p.start.copy(u.start),c.subVectors(f.end,u.end),c.dot(a)<0?p.end.copy(f.end):p.end.copy(u.end)),!0)}}}();vn.prototype.distanceToPoint=function(){const i=new I;return function(e){return this.closestPointToPoint(e,i),e.distanceTo(i)}}();vn.prototype.distanceToTriangle=function(){const i=new I,t=new I,e=["a","b","c"],n=new Hn,s=new Hn;return function(o,a=null,l=null){const c=a||l?n:null;if(this.intersectsTriangle(o,c))return(a||l)&&(a&&c.getCenter(a),l&&c.getCenter(l)),0;let h=1/0;for(let f=0;f<3;f++){let u;const d=e[f],g=o[d];this.closestPointToPoint(g,i),u=g.distanceToSquared(i),u<h&&(h=u,a&&a.copy(i),l&&l.copy(g));const _=this[d];o.closestPointToPoint(_,i),u=_.distanceToSquared(i),u<h&&(h=u,a&&a.copy(_),l&&l.copy(i))}for(let f=0;f<3;f++){const u=e[f],d=e[(f+1)%3];n.set(this[u],this[d]);for(let g=0;g<3;g++){const _=e[g],m=e[(g+1)%3];s.set(o[_],o[m]),Ya(n,s,i,t);const p=i.distanceToSquared(t);p<h&&(h=p,a&&a.copy(i),l&&l.copy(t))}}return Math.sqrt(h)}}();class ze{constructor(t,e,n){this.isOrientedBox=!0,this.min=new I,this.max=new I,this.matrix=new Kt,this.invMatrix=new Kt,this.points=new Array(8).fill().map(()=>new I),this.satAxes=new Array(3).fill().map(()=>new I),this.satBounds=new Array(3).fill().map(()=>new Gn),this.alignedSatBounds=new Array(3).fill().map(()=>new Gn),this.needsUpdate=!1,t&&this.min.copy(t),e&&this.max.copy(e),n&&this.matrix.copy(n)}set(t,e,n){this.min.copy(t),this.max.copy(e),this.matrix.copy(n),this.needsUpdate=!0}copy(t){this.min.copy(t.min),this.max.copy(t.max),this.matrix.copy(t.matrix),this.needsUpdate=!0}}ze.prototype.update=function(){return function(){const t=this.matrix,e=this.min,n=this.max,s=this.points;for(let c=0;c<=1;c++)for(let h=0;h<=1;h++)for(let f=0;f<=1;f++){const u=1*c|2*h|4*f,d=s[u];d.x=c?n.x:e.x,d.y=h?n.y:e.y,d.z=f?n.z:e.z,d.applyMatrix4(t)}const r=this.satBounds,o=this.satAxes,a=s[0];for(let c=0;c<3;c++){const h=o[c],f=r[c],u=1<<c,d=s[u];h.subVectors(a,d),f.setFromPoints(h,s)}const l=this.alignedSatBounds;l[0].setFromPointsField(s,"x"),l[1].setFromPointsField(s,"y"),l[2].setFromPointsField(s,"z"),this.invMatrix.copy(this.matrix).invert(),this.needsUpdate=!1}}();ze.prototype.intersectsBox=function(){const i=new Gn;return function(e){this.needsUpdate&&this.update();const n=e.min,s=e.max,r=this.satBounds,o=this.satAxes,a=this.alignedSatBounds;if(i.min=n.x,i.max=s.x,a[0].isSeparated(i)||(i.min=n.y,i.max=s.y,a[1].isSeparated(i))||(i.min=n.z,i.max=s.z,a[2].isSeparated(i)))return!1;for(let l=0;l<3;l++){const c=o[l],h=r[l];if(i.setFromBox(c,e),h.isSeparated(i))return!1}return!0}}();ze.prototype.intersectsTriangle=function(){const i=new vn,t=new Array(3),e=new Gn,n=new Gn,s=new I;return function(o){this.needsUpdate&&this.update(),o.isExtendedTriangle?o.needsUpdate&&o.update():(i.copy(o),i.update(),o=i);const a=this.satBounds,l=this.satAxes;t[0]=o.a,t[1]=o.b,t[2]=o.c;for(let u=0;u<3;u++){const d=a[u],g=l[u];if(e.setFromPoints(g,t),d.isSeparated(e))return!1}const c=o.satBounds,h=o.satAxes,f=this.points;for(let u=0;u<3;u++){const d=c[u],g=h[u];if(e.setFromPoints(g,f),d.isSeparated(e))return!1}for(let u=0;u<3;u++){const d=l[u];for(let g=0;g<4;g++){const _=h[g];if(s.crossVectors(d,_),e.setFromPoints(s,t),n.setFromPoints(s,f),e.isSeparated(n))return!1}}return!0}}();ze.prototype.closestPointToPoint=function(){return function(t,e){return this.needsUpdate&&this.update(),e.copy(t).applyMatrix4(this.invMatrix).clamp(this.min,this.max).applyMatrix4(this.matrix),e}}();ze.prototype.distanceToPoint=function(){const i=new I;return function(e){return this.closestPointToPoint(e,i),e.distanceTo(i)}}();ze.prototype.distanceToBox=function(){const i=["x","y","z"],t=new Array(12).fill().map(()=>new Hn),e=new Array(12).fill().map(()=>new Hn),n=new I,s=new I;return function(o,a=0,l=null,c=null){if(this.needsUpdate&&this.update(),this.intersectsBox(o))return(l||c)&&(o.getCenter(s),this.closestPointToPoint(s,n),o.closestPointToPoint(n,s),l&&l.copy(n),c&&c.copy(s)),0;const h=a*a,f=o.min,u=o.max,d=this.points;let g=1/0;for(let m=0;m<8;m++){const p=d[m];s.copy(p).clamp(f,u);const M=p.distanceToSquared(s);if(M<g&&(g=M,l&&l.copy(p),c&&c.copy(s),M<h))return Math.sqrt(M)}let _=0;for(let m=0;m<3;m++)for(let p=0;p<=1;p++)for(let M=0;M<=1;M++){const x=(m+1)%3,E=(m+2)%3,A=p<<x|M<<E,b=1<<m|p<<x|M<<E,S=d[A],P=d[b];t[_].set(S,P);const v=i[m],R=i[x],L=i[E],D=e[_],N=D.start,z=D.end;N[v]=f[v],N[R]=p?f[R]:u[R],N[L]=M?f[L]:u[R],z[v]=u[v],z[R]=p?f[R]:u[R],z[L]=M?f[L]:u[R],_++}for(let m=0;m<=1;m++)for(let p=0;p<=1;p++)for(let M=0;M<=1;M++){s.x=m?u.x:f.x,s.y=p?u.y:f.y,s.z=M?u.z:f.z,this.closestPointToPoint(s,n);const x=s.distanceToSquared(n);if(x<g&&(g=x,l&&l.copy(n),c&&c.copy(s),x<h))return Math.sqrt(x)}for(let m=0;m<12;m++){const p=t[m];for(let M=0;M<12;M++){const x=e[M];Ya(p,x,n,s);const E=n.distanceToSquared(s);if(E<g&&(g=E,l&&l.copy(n),c&&c.copy(s),E<h))return Math.sqrt(E)}}return Math.sqrt(g)}}();class ja{constructor(t){this._getNewPrimitive=t,this._primitives=[]}getPrimitive(){const t=this._primitives;return t.length===0?this._getNewPrimitive():t.pop()}releasePrimitive(t){this._primitives.push(t)}}class p0 extends ja{constructor(){super(()=>new vn)}}const cn=new p0;class m0{constructor(){this.float32Array=null,this.uint16Array=null,this.uint32Array=null;const t=[];let e=null;this.setBuffer=n=>{e&&t.push(e),e=n,this.float32Array=new Float32Array(n),this.uint16Array=new Uint16Array(n),this.uint32Array=new Uint32Array(n)},this.clearBuffer=()=>{e=null,this.float32Array=null,this.uint16Array=null,this.uint32Array=null,t.length!==0&&this.setBuffer(t.pop())}}}const ae=new m0;let ri,fs;const Qi=[],Cr=new ja(()=>new Oe);function g0(i,t,e,n,s,r){ri=Cr.getPrimitive(),fs=Cr.getPrimitive(),Qi.push(ri,fs),ae.setBuffer(i._roots[t]);const o=La(0,i.geometry,e,n,s,r);ae.clearBuffer(),Cr.releasePrimitive(ri),Cr.releasePrimitive(fs),Qi.pop(),Qi.pop();const a=Qi.length;return a>0&&(fs=Qi[a-1],ri=Qi[a-2]),o}function La(i,t,e,n,s=null,r=0,o=0){const{float32Array:a,uint16Array:l,uint32Array:c}=ae;let h=i*2;if(He(h,l)){const g=$e(i,c),_=on(h,l);return pe(i,a,ri),n(g,_,!1,o,r+i,ri)}else{let L=function(N){const{uint16Array:z,uint32Array:O}=ae;let Y=N*2;for(;!He(Y,z);)N=an(N),Y=N*2;return $e(N,O)},D=function(N){const{uint16Array:z,uint32Array:O}=ae;let Y=N*2;for(;!He(Y,z);)N=ln(N,O),Y=N*2;return $e(N,O)+on(Y,z)};var u=L,d=D;const g=an(i),_=ln(i,c);let m=g,p=_,M,x,E,A;if(s&&(E=ri,A=fs,pe(m,a,E),pe(p,a,A),M=s(E),x=s(A),x<M)){m=_,p=g;const N=M;M=x,x=N,E=A}E||(E=ri,pe(m,a,E));const b=He(m*2,l),S=e(E,b,M,o+1,r+m);let P;if(S===Lc){const N=L(m),O=D(m)-N;P=n(N,O,!0,o+1,r+m,E)}else P=S&&La(m,t,e,n,s,r,o+1);if(P)return!0;A=fs,pe(p,a,A);const T=He(p*2,l),v=e(A,T,x,o+1,r+p);let R;if(v===Lc){const N=L(p),O=D(p)-N;R=n(N,O,!0,o+1,r+p,A)}else R=v&&La(p,t,e,n,s,r,o+1);return!!R}}const Is=new I,la=new I;function _0(i,t,e={},n=0,s=1/0){const r=n*n,o=s*s;let a=1/0,l=null;if(i.shapecast({boundsTraverseOrder:h=>(Is.copy(t).clamp(h.min,h.max),Is.distanceToSquared(t)),intersectsBounds:(h,f,u)=>u<a&&u<o,intersectsTriangle:(h,f)=>{h.closestPointToPoint(t,Is);const u=t.distanceToSquared(Is);return u<a&&(la.copy(Is),a=u,l=f),u<r}}),a===1/0)return null;const c=Math.sqrt(a);return e.point?e.point.copy(la):e.point=la.clone(),e.distance=c,e.faceIndex=l,e}const ts=new I,es=new I,ns=new I,Pr=new At,Lr=new At,Dr=new At,Fc=new I,Oc=new I,zc=new I,Ur=new I;function x0(i,t,e,n,s,r,o,a){let l;if(r===Fe?l=i.intersectTriangle(n,e,t,!0,s):l=i.intersectTriangle(t,e,n,r!==En,s),l===null)return null;const c=i.origin.distanceTo(s);return c<o||c>a?null:{distance:c,point:s.clone()}}function v0(i,t,e,n,s,r,o,a,l,c,h){ts.fromBufferAttribute(t,r),es.fromBufferAttribute(t,o),ns.fromBufferAttribute(t,a);const f=x0(i,ts,es,ns,Ur,l,c,h);if(f){n&&(Pr.fromBufferAttribute(n,r),Lr.fromBufferAttribute(n,o),Dr.fromBufferAttribute(n,a),f.uv=Ne.getInterpolation(Ur,ts,es,ns,Pr,Lr,Dr,new At)),s&&(Pr.fromBufferAttribute(s,r),Lr.fromBufferAttribute(s,o),Dr.fromBufferAttribute(s,a),f.uv1=Ne.getInterpolation(Ur,ts,es,ns,Pr,Lr,Dr,new At)),e&&(Fc.fromBufferAttribute(e,r),Oc.fromBufferAttribute(e,o),zc.fromBufferAttribute(e,a),f.normal=Ne.getInterpolation(Ur,ts,es,ns,Fc,Oc,zc,new I),f.normal.dot(i.direction)>0&&f.normal.multiplyScalar(-1));const u={a:r,b:o,c:a,normal:new I,materialIndex:0};Ne.getNormal(ts,es,ns,u.normal),f.face=u,f.faceIndex=r}return f}function go(i,t,e,n,s,r,o){const a=n*3;let l=a+0,c=a+1,h=a+2;const f=i.index;i.index&&(l=f.getX(l),c=f.getX(c),h=f.getX(h));const{position:u,normal:d,uv:g,uv1:_}=i.attributes,m=v0(e,u,d,g,_,l,c,h,t,r,o);return m?(m.faceIndex=n,s&&s.push(m),m):null}function _e(i,t,e,n){const s=i.a,r=i.b,o=i.c;let a=t,l=t+1,c=t+2;e&&(a=e.getX(a),l=e.getX(l),c=e.getX(c)),s.x=n.getX(a),s.y=n.getY(a),s.z=n.getZ(a),r.x=n.getX(l),r.y=n.getY(l),r.z=n.getZ(l),o.x=n.getX(c),o.y=n.getY(c),o.z=n.getZ(c)}function M0(i,t,e,n,s,r,o,a){const{geometry:l,_indirectBuffer:c}=i;for(let h=n,f=n+s;h<f;h++)go(l,t,e,h,r,o,a)}function S0(i,t,e,n,s,r,o){const{geometry:a,_indirectBuffer:l}=i;let c=1/0,h=null;for(let f=n,u=n+s;f<u;f++){let d;d=go(a,t,e,f,null,r,o),d&&d.distance<c&&(h=d,c=d.distance)}return h}function y0(i,t,e,n,s,r,o){const{geometry:a}=e,{index:l}=a,c=a.attributes.position;for(let h=i,f=t+i;h<f;h++){let u;if(u=h,_e(o,u*3,l,c),o.needsUpdate=!0,n(o,u,s,r))return!0}return!1}function E0(i,t=null){t&&Array.isArray(t)&&(t=new Set(t));const e=i.geometry,n=e.index?e.index.array:null,s=e.attributes.position;let r,o,a,l,c=0;const h=i._roots;for(let u=0,d=h.length;u<d;u++)r=h[u],o=new Uint32Array(r),a=new Uint16Array(r),l=new Float32Array(r),f(0,c),c+=r.byteLength;function f(u,d,g=!1){const _=u*2;if(a[_+15]===mo){const p=o[u+6],M=a[_+14];let x=1/0,E=1/0,A=1/0,b=-1/0,S=-1/0,P=-1/0;for(let T=3*p,v=3*(p+M);T<v;T++){let R=n[T];const L=s.getX(R),D=s.getY(R),N=s.getZ(R);L<x&&(x=L),L>b&&(b=L),D<E&&(E=D),D>S&&(S=D),N<A&&(A=N),N>P&&(P=N)}return l[u+0]!==x||l[u+1]!==E||l[u+2]!==A||l[u+3]!==b||l[u+4]!==S||l[u+5]!==P?(l[u+0]=x,l[u+1]=E,l[u+2]=A,l[u+3]=b,l[u+4]=S,l[u+5]=P,!0):!1}else{const p=u+8,M=o[u+6],x=p+d,E=M+d;let A=g,b=!1,S=!1;t?A||(b=t.has(x),S=t.has(E),A=!b&&!S):(b=!0,S=!0);const P=A||b,T=A||S;let v=!1;P&&(v=f(p,d,A));let R=!1;T&&(R=f(M,d,A));const L=v||R;if(L)for(let D=0;D<3;D++){const N=p+D,z=M+D,O=l[N],Y=l[N+3],B=l[z],it=l[z+3];l[u+D]=O<B?O:B,l[u+D+3]=Y>it?Y:it}return L}}}function ui(i,t,e,n,s){let r,o,a,l,c,h;const f=1/e.direction.x,u=1/e.direction.y,d=1/e.direction.z,g=e.origin.x,_=e.origin.y,m=e.origin.z;let p=t[i],M=t[i+3],x=t[i+1],E=t[i+3+1],A=t[i+2],b=t[i+3+2];return f>=0?(r=(p-g)*f,o=(M-g)*f):(r=(M-g)*f,o=(p-g)*f),u>=0?(a=(x-_)*u,l=(E-_)*u):(a=(E-_)*u,l=(x-_)*u),r>l||a>o||((a>r||isNaN(r))&&(r=a),(l<o||isNaN(o))&&(o=l),d>=0?(c=(A-m)*d,h=(b-m)*d):(c=(b-m)*d,h=(A-m)*d),r>h||c>o)?!1:((c>r||r!==r)&&(r=c),(h<o||o!==o)&&(o=h),r<=s&&o>=n)}function T0(i,t,e,n,s,r,o,a){const{geometry:l,_indirectBuffer:c}=i;for(let h=n,f=n+s;h<f;h++){let u=c?c[h]:h;go(l,t,e,u,r,o,a)}}function b0(i,t,e,n,s,r,o){const{geometry:a,_indirectBuffer:l}=i;let c=1/0,h=null;for(let f=n,u=n+s;f<u;f++){let d;d=go(a,t,e,l?l[f]:f,null,r,o),d&&d.distance<c&&(h=d,c=d.distance)}return h}function A0(i,t,e,n,s,r,o){const{geometry:a}=e,{index:l}=a,c=a.attributes.position;for(let h=i,f=t+i;h<f;h++){let u;if(u=e.resolveTriangleIndex(h),_e(o,u*3,l,c),o.needsUpdate=!0,n(o,u,s,r))return!0}return!1}function w0(i,t,e,n,s,r,o){ae.setBuffer(i._roots[t]),Da(0,i,e,n,s,r,o),ae.clearBuffer()}function Da(i,t,e,n,s,r,o){const{float32Array:a,uint16Array:l,uint32Array:c}=ae,h=i*2;if(He(h,l)){const u=$e(i,c),d=on(h,l);M0(t,e,n,u,d,s,r,o)}else{const u=an(i);ui(u,a,n,r,o)&&Da(u,t,e,n,s,r,o);const d=ln(i,c);ui(d,a,n,r,o)&&Da(d,t,e,n,s,r,o)}}const R0=["x","y","z"];function C0(i,t,e,n,s,r){ae.setBuffer(i._roots[t]);const o=Ua(0,i,e,n,s,r);return ae.clearBuffer(),o}function Ua(i,t,e,n,s,r){const{float32Array:o,uint16Array:a,uint32Array:l}=ae;let c=i*2;if(He(c,a)){const f=$e(i,l),u=on(c,a);return S0(t,e,n,f,u,s,r)}else{const f=Ju(i,l),u=R0[f],g=n.direction[u]>=0;let _,m;g?(_=an(i),m=ln(i,l)):(_=ln(i,l),m=an(i));const M=ui(_,o,n,s,r)?Ua(_,t,e,n,s,r):null;if(M){const A=M.point[u];if(g?A<=o[m+f]:A>=o[m+f+3])return M}const E=ui(m,o,n,s,r)?Ua(m,t,e,n,s,r):null;return M&&E?M.distance<=E.distance?M:E:M||E||null}}const Ir=new Oe,is=new vn,ss=new vn,Ns=new Kt,Bc=new ze,Nr=new ze;function P0(i,t,e,n){ae.setBuffer(i._roots[t]);const s=Ia(0,i,e,n);return ae.clearBuffer(),s}function Ia(i,t,e,n,s=null){const{float32Array:r,uint16Array:o,uint32Array:a}=ae;let l=i*2;if(s===null&&(e.boundingBox||e.computeBoundingBox(),Bc.set(e.boundingBox.min,e.boundingBox.max,n),s=Bc),He(l,o)){const h=t.geometry,f=h.index,u=h.attributes.position,d=e.index,g=e.attributes.position,_=$e(i,a),m=on(l,o);if(Ns.copy(n).invert(),e.boundsTree)return pe(i,r,Nr),Nr.matrix.copy(Ns),Nr.needsUpdate=!0,e.boundsTree.shapecast({intersectsBounds:M=>Nr.intersectsBox(M),intersectsTriangle:M=>{M.a.applyMatrix4(n),M.b.applyMatrix4(n),M.c.applyMatrix4(n),M.needsUpdate=!0;for(let x=_*3,E=(m+_)*3;x<E;x+=3)if(_e(ss,x,f,u),ss.needsUpdate=!0,M.intersectsTriangle(ss))return!0;return!1}});for(let p=_*3,M=(m+_)*3;p<M;p+=3){_e(is,p,f,u),is.a.applyMatrix4(Ns),is.b.applyMatrix4(Ns),is.c.applyMatrix4(Ns),is.needsUpdate=!0;for(let x=0,E=d.count;x<E;x+=3)if(_e(ss,x,d,g),ss.needsUpdate=!0,is.intersectsTriangle(ss))return!0}}else{const h=i+8,f=a[i+6];return pe(h,r,Ir),!!(s.intersectsBox(Ir)&&Ia(h,t,e,n,s)||(pe(f,r,Ir),s.intersectsBox(Ir)&&Ia(f,t,e,n,s)))}}const Fr=new Kt,ca=new ze,Fs=new ze,L0=new I,D0=new I,U0=new I,I0=new I;function N0(i,t,e,n={},s={},r=0,o=1/0){t.boundingBox||t.computeBoundingBox(),ca.set(t.boundingBox.min,t.boundingBox.max,e),ca.needsUpdate=!0;const a=i.geometry,l=a.attributes.position,c=a.index,h=t.attributes.position,f=t.index,u=cn.getPrimitive(),d=cn.getPrimitive();let g=L0,_=D0,m=null,p=null;s&&(m=U0,p=I0);let M=1/0,x=null,E=null;return Fr.copy(e).invert(),Fs.matrix.copy(Fr),i.shapecast({boundsTraverseOrder:A=>ca.distanceToBox(A),intersectsBounds:(A,b,S)=>S<M&&S<o?(b&&(Fs.min.copy(A.min),Fs.max.copy(A.max),Fs.needsUpdate=!0),!0):!1,intersectsRange:(A,b)=>{if(t.boundsTree)return t.boundsTree.shapecast({boundsTraverseOrder:P=>Fs.distanceToBox(P),intersectsBounds:(P,T,v)=>v<M&&v<o,intersectsRange:(P,T)=>{for(let v=P,R=P+T;v<R;v++){_e(d,3*v,f,h),d.a.applyMatrix4(e),d.b.applyMatrix4(e),d.c.applyMatrix4(e),d.needsUpdate=!0;for(let L=A,D=A+b;L<D;L++){_e(u,3*L,c,l),u.needsUpdate=!0;const N=u.distanceToTriangle(d,g,m);if(N<M&&(_.copy(g),p&&p.copy(m),M=N,x=L,E=v),N<r)return!0}}}});{const S=As(t);for(let P=0,T=S;P<T;P++){_e(d,3*P,f,h),d.a.applyMatrix4(e),d.b.applyMatrix4(e),d.c.applyMatrix4(e),d.needsUpdate=!0;for(let v=A,R=A+b;v<R;v++){_e(u,3*v,c,l),u.needsUpdate=!0;const L=u.distanceToTriangle(d,g,m);if(L<M&&(_.copy(g),p&&p.copy(m),M=L,x=v,E=P),L<r)return!0}}}}}),cn.releasePrimitive(u),cn.releasePrimitive(d),M===1/0?null:(n.point?n.point.copy(_):n.point=_.clone(),n.distance=M,n.faceIndex=x,s&&(s.point?s.point.copy(p):s.point=p.clone(),s.point.applyMatrix4(Fr),_.applyMatrix4(Fr),s.distance=_.sub(s.point).length(),s.faceIndex=E),n)}function F0(i,t=null){t&&Array.isArray(t)&&(t=new Set(t));const e=i.geometry,n=e.index?e.index.array:null,s=e.attributes.position;let r,o,a,l,c=0;const h=i._roots;for(let u=0,d=h.length;u<d;u++)r=h[u],o=new Uint32Array(r),a=new Uint16Array(r),l=new Float32Array(r),f(0,c),c+=r.byteLength;function f(u,d,g=!1){const _=u*2;if(a[_+15]===mo){const p=o[u+6],M=a[_+14];let x=1/0,E=1/0,A=1/0,b=-1/0,S=-1/0,P=-1/0;for(let T=p,v=p+M;T<v;T++){const R=3*i.resolveTriangleIndex(T);for(let L=0;L<3;L++){let D=R+L;D=n?n[D]:D;const N=s.getX(D),z=s.getY(D),O=s.getZ(D);N<x&&(x=N),N>b&&(b=N),z<E&&(E=z),z>S&&(S=z),O<A&&(A=O),O>P&&(P=O)}}return l[u+0]!==x||l[u+1]!==E||l[u+2]!==A||l[u+3]!==b||l[u+4]!==S||l[u+5]!==P?(l[u+0]=x,l[u+1]=E,l[u+2]=A,l[u+3]=b,l[u+4]=S,l[u+5]=P,!0):!1}else{const p=u+8,M=o[u+6],x=p+d,E=M+d;let A=g,b=!1,S=!1;t?A||(b=t.has(x),S=t.has(E),A=!b&&!S):(b=!0,S=!0);const P=A||b,T=A||S;let v=!1;P&&(v=f(p,d,A));let R=!1;T&&(R=f(M,d,A));const L=v||R;if(L)for(let D=0;D<3;D++){const N=p+D,z=M+D,O=l[N],Y=l[N+3],B=l[z],it=l[z+3];l[u+D]=O<B?O:B,l[u+D+3]=Y>it?Y:it}return L}}}function O0(i,t,e,n,s,r,o){ae.setBuffer(i._roots[t]),Na(0,i,e,n,s,r,o),ae.clearBuffer()}function Na(i,t,e,n,s,r,o){const{float32Array:a,uint16Array:l,uint32Array:c}=ae,h=i*2;if(He(h,l)){const u=$e(i,c),d=on(h,l);T0(t,e,n,u,d,s,r,o)}else{const u=an(i);ui(u,a,n,r,o)&&Na(u,t,e,n,s,r,o);const d=ln(i,c);ui(d,a,n,r,o)&&Na(d,t,e,n,s,r,o)}}const z0=["x","y","z"];function B0(i,t,e,n,s,r){ae.setBuffer(i._roots[t]);const o=Fa(0,i,e,n,s,r);return ae.clearBuffer(),o}function Fa(i,t,e,n,s,r){const{float32Array:o,uint16Array:a,uint32Array:l}=ae;let c=i*2;if(He(c,a)){const f=$e(i,l),u=on(c,a);return b0(t,e,n,f,u,s,r)}else{const f=Ju(i,l),u=z0[f],g=n.direction[u]>=0;let _,m;g?(_=an(i),m=ln(i,l)):(_=ln(i,l),m=an(i));const M=ui(_,o,n,s,r)?Fa(_,t,e,n,s,r):null;if(M){const A=M.point[u];if(g?A<=o[m+f]:A>=o[m+f+3])return M}const E=ui(m,o,n,s,r)?Fa(m,t,e,n,s,r):null;return M&&E?M.distance<=E.distance?M:E:M||E||null}}const Or=new Oe,rs=new vn,os=new vn,Os=new Kt,kc=new ze,zr=new ze;function k0(i,t,e,n){ae.setBuffer(i._roots[t]);const s=Oa(0,i,e,n);return ae.clearBuffer(),s}function Oa(i,t,e,n,s=null){const{float32Array:r,uint16Array:o,uint32Array:a}=ae;let l=i*2;if(s===null&&(e.boundingBox||e.computeBoundingBox(),kc.set(e.boundingBox.min,e.boundingBox.max,n),s=kc),He(l,o)){const h=t.geometry,f=h.index,u=h.attributes.position,d=e.index,g=e.attributes.position,_=$e(i,a),m=on(l,o);if(Os.copy(n).invert(),e.boundsTree)return pe(i,r,zr),zr.matrix.copy(Os),zr.needsUpdate=!0,e.boundsTree.shapecast({intersectsBounds:M=>zr.intersectsBox(M),intersectsTriangle:M=>{M.a.applyMatrix4(n),M.b.applyMatrix4(n),M.c.applyMatrix4(n),M.needsUpdate=!0;for(let x=_,E=m+_;x<E;x++)if(_e(os,3*t.resolveTriangleIndex(x),f,u),os.needsUpdate=!0,M.intersectsTriangle(os))return!0;return!1}});for(let p=_,M=m+_;p<M;p++){const x=t.resolveTriangleIndex(p);_e(rs,3*x,f,u),rs.a.applyMatrix4(Os),rs.b.applyMatrix4(Os),rs.c.applyMatrix4(Os),rs.needsUpdate=!0;for(let E=0,A=d.count;E<A;E+=3)if(_e(os,E,d,g),os.needsUpdate=!0,rs.intersectsTriangle(os))return!0}}else{const h=i+8,f=a[i+6];return pe(h,r,Or),!!(s.intersectsBox(Or)&&Oa(h,t,e,n,s)||(pe(f,r,Or),s.intersectsBox(Or)&&Oa(f,t,e,n,s)))}}const Br=new Kt,ua=new ze,zs=new ze,H0=new I,G0=new I,V0=new I,W0=new I;function X0(i,t,e,n={},s={},r=0,o=1/0){t.boundingBox||t.computeBoundingBox(),ua.set(t.boundingBox.min,t.boundingBox.max,e),ua.needsUpdate=!0;const a=i.geometry,l=a.attributes.position,c=a.index,h=t.attributes.position,f=t.index,u=cn.getPrimitive(),d=cn.getPrimitive();let g=H0,_=G0,m=null,p=null;s&&(m=V0,p=W0);let M=1/0,x=null,E=null;return Br.copy(e).invert(),zs.matrix.copy(Br),i.shapecast({boundsTraverseOrder:A=>ua.distanceToBox(A),intersectsBounds:(A,b,S)=>S<M&&S<o?(b&&(zs.min.copy(A.min),zs.max.copy(A.max),zs.needsUpdate=!0),!0):!1,intersectsRange:(A,b)=>{if(t.boundsTree){const S=t.boundsTree;return S.shapecast({boundsTraverseOrder:P=>zs.distanceToBox(P),intersectsBounds:(P,T,v)=>v<M&&v<o,intersectsRange:(P,T)=>{for(let v=P,R=P+T;v<R;v++){const L=S.resolveTriangleIndex(v);_e(d,3*L,f,h),d.a.applyMatrix4(e),d.b.applyMatrix4(e),d.c.applyMatrix4(e),d.needsUpdate=!0;for(let D=A,N=A+b;D<N;D++){const z=i.resolveTriangleIndex(D);_e(u,3*z,c,l),u.needsUpdate=!0;const O=u.distanceToTriangle(d,g,m);if(O<M&&(_.copy(g),p&&p.copy(m),M=O,x=D,E=v),O<r)return!0}}}})}else{const S=As(t);for(let P=0,T=S;P<T;P++){_e(d,3*P,f,h),d.a.applyMatrix4(e),d.b.applyMatrix4(e),d.c.applyMatrix4(e),d.needsUpdate=!0;for(let v=A,R=A+b;v<R;v++){const L=i.resolveTriangleIndex(v);_e(u,3*L,c,l),u.needsUpdate=!0;const D=u.distanceToTriangle(d,g,m);if(D<M&&(_.copy(g),p&&p.copy(m),M=D,x=v,E=P),D<r)return!0}}}}}),cn.releasePrimitive(u),cn.releasePrimitive(d),M===1/0?null:(n.point?n.point.copy(_):n.point=_.clone(),n.distance=M,n.faceIndex=x,s&&(s.point?s.point.copy(p):s.point=p.clone(),s.point.applyMatrix4(Br),_.applyMatrix4(Br),s.distance=_.sub(s.point).length(),s.faceIndex=E),n)}function q0(){return typeof SharedArrayBuffer<"u"}const qs=new ae.constructor,lo=new ae.constructor,Jn=new ja(()=>new Oe),as=new Oe,ls=new Oe,ha=new Oe,fa=new Oe;let da=!1;function Y0(i,t,e,n){if(da)throw new Error("MeshBVH: Recursive calls to bvhcast not supported.");da=!0;const s=i._roots,r=t._roots;let o,a=0,l=0;const c=new Kt().copy(e).invert();for(let h=0,f=s.length;h<f;h++){qs.setBuffer(s[h]),l=0;const u=Jn.getPrimitive();pe(0,qs.float32Array,u),u.applyMatrix4(c);for(let d=0,g=r.length;d<g&&(lo.setBuffer(r[h]),o=mn(0,0,e,c,n,a,l,0,0,u),lo.clearBuffer(),l+=r[d].length,!o);d++);if(Jn.releasePrimitive(u),qs.clearBuffer(),a+=s[h].length,o)break}return da=!1,o}function mn(i,t,e,n,s,r=0,o=0,a=0,l=0,c=null,h=!1){let f,u;h?(f=lo,u=qs):(f=qs,u=lo);const d=f.float32Array,g=f.uint32Array,_=f.uint16Array,m=u.float32Array,p=u.uint32Array,M=u.uint16Array,x=i*2,E=t*2,A=He(x,_),b=He(E,M);let S=!1;if(b&&A)h?S=s($e(t,p),on(t*2,M),$e(i,g),on(i*2,_),l,o+t,a,r+i):S=s($e(i,g),on(i*2,_),$e(t,p),on(t*2,M),a,r+i,l,o+t);else if(b){const P=Jn.getPrimitive();pe(t,m,P),P.applyMatrix4(e);const T=an(i),v=ln(i,g);pe(T,d,as),pe(v,d,ls);const R=P.intersectsBox(as),L=P.intersectsBox(ls);S=R&&mn(t,T,n,e,s,o,r,l,a+1,P,!h)||L&&mn(t,v,n,e,s,o,r,l,a+1,P,!h),Jn.releasePrimitive(P)}else{const P=an(t),T=ln(t,p);pe(P,m,ha),pe(T,m,fa);const v=c.intersectsBox(ha),R=c.intersectsBox(fa);if(v&&R)S=mn(i,P,e,n,s,r,o,a,l+1,c,h)||mn(i,T,e,n,s,r,o,a,l+1,c,h);else if(v)if(A)S=mn(i,P,e,n,s,r,o,a,l+1,c,h);else{const L=Jn.getPrimitive();L.copy(ha).applyMatrix4(e);const D=an(i),N=ln(i,g);pe(D,d,as),pe(N,d,ls);const z=L.intersectsBox(as),O=L.intersectsBox(ls);S=z&&mn(P,D,n,e,s,o,r,l,a+1,L,!h)||O&&mn(P,N,n,e,s,o,r,l,a+1,L,!h),Jn.releasePrimitive(L)}else if(R)if(A)S=mn(i,T,e,n,s,r,o,a,l+1,c,h);else{const L=Jn.getPrimitive();L.copy(fa).applyMatrix4(e);const D=an(i),N=ln(i,g);pe(D,d,as),pe(N,d,ls);const z=L.intersectsBox(as),O=L.intersectsBox(ls);S=z&&mn(T,D,n,e,s,o,r,l,a+1,L,!h)||O&&mn(T,N,n,e,s,o,r,l,a+1,L,!h),Jn.releasePrimitive(L)}}return S}const kr=new ze,Hc=new Oe,j0={strategy:Ku,maxDepth:40,maxLeafTris:10,useSharedArrayBuffer:!1,setBoundingBox:!0,onProgress:null,indirect:!1,verbose:!0};class Ka{static serialize(t,e={}){e={cloneBuffers:!0,...e};const n=t.geometry,s=t._roots,r=t._indirectBuffer,o=n.getIndex();let a;return e.cloneBuffers?a={roots:s.map(l=>l.slice()),index:o?o.array.slice():null,indirectBuffer:r?r.slice():null}:a={roots:s,index:o?o.array:null,indirectBuffer:r},a}static deserialize(t,e,n={}){n={setIndex:!0,indirect:!!t.indirectBuffer,...n};const{index:s,roots:r,indirectBuffer:o}=t,a=new Ka(e,{...n,[sa]:!0});if(a._roots=r,a._indirectBuffer=o||null,n.setIndex){const l=e.getIndex();if(l===null){const c=new Je(t.index,1,!1);e.setIndex(c)}else l.array!==s&&(l.array.set(s),l.needsUpdate=!0)}return a}get indirect(){return!!this._indirectBuffer}constructor(t,e={}){if(t.isBufferGeometry){if(t.index&&t.index.isInterleavedBufferAttribute)throw new Error("MeshBVH: InterleavedBufferAttribute is not supported for the index attribute.")}else throw new Error("MeshBVH: Only BufferGeometries are supported.");if(e=Object.assign({...j0,[sa]:!1},e),e.useSharedArrayBuffer&&!q0())throw new Error("MeshBVH: SharedArrayBuffer is not available.");this.geometry=t,this._roots=null,this._indirectBuffer=null,e[sa]||(u0(this,e),!t.boundingBox&&e.setBoundingBox&&(t.boundingBox=this.getBoundingBox(new Oe))),this.resolveTriangleIndex=e.indirect?n=>this._indirectBuffer[n]:n=>n}refit(t=null){return(this.indirect?F0:E0)(this,t)}traverse(t,e=0){const n=this._roots[e],s=new Uint32Array(n),r=new Uint16Array(n);o(0);function o(a,l=0){const c=a*2,h=r[c+15]===mo;if(h){const f=s[a+6],u=r[c+14];t(l,h,new Float32Array(n,a*4,6),f,u)}else{const f=a+Xs/4,u=s[a+6],d=s[a+7];t(l,h,new Float32Array(n,a*4,6),d)||(o(f,l+1),o(u,l+1))}}}raycast(t,e=wn,n=0,s=1/0){const r=this._roots,o=this.geometry,a=[],l=e.isMaterial,c=Array.isArray(e),h=o.groups,f=l?e.side:e,u=this.indirect?O0:w0;for(let d=0,g=r.length;d<g;d++){const _=c?e[h[d].materialIndex].side:f,m=a.length;if(u(this,d,_,t,a,n,s),c){const p=h[d].materialIndex;for(let M=m,x=a.length;M<x;M++)a[M].face.materialIndex=p}}return a}raycastFirst(t,e=wn,n=0,s=1/0){const r=this._roots,o=this.geometry,a=e.isMaterial,l=Array.isArray(e);let c=null;const h=o.groups,f=a?e.side:e,u=this.indirect?B0:C0;for(let d=0,g=r.length;d<g;d++){const _=l?e[h[d].materialIndex].side:f,m=u(this,d,_,t,n,s);m!=null&&(c==null||m.distance<c.distance)&&(c=m,l&&(m.face.materialIndex=h[d].materialIndex))}return c}intersectsGeometry(t,e){let n=!1;const s=this._roots,r=this.indirect?k0:P0;for(let o=0,a=s.length;o<a&&(n=r(this,o,t,e),!n);o++);return n}shapecast(t){const e=cn.getPrimitive(),n=this.indirect?A0:y0;let{boundsTraverseOrder:s,intersectsBounds:r,intersectsRange:o,intersectsTriangle:a}=t;if(o&&a){const f=o;o=(u,d,g,_,m)=>f(u,d,g,_,m)?!0:n(u,d,this,a,g,_,e)}else o||(a?o=(f,u,d,g)=>n(f,u,this,a,d,g,e):o=(f,u,d)=>d);let l=!1,c=0;const h=this._roots;for(let f=0,u=h.length;f<u;f++){const d=h[f];if(l=g0(this,f,r,o,s,c),l)break;c+=d.byteLength}return cn.releasePrimitive(e),l}bvhcast(t,e,n){let{intersectsRanges:s,intersectsTriangles:r}=n;const o=cn.getPrimitive(),a=this.geometry.index,l=this.geometry.attributes.position,c=this.indirect?g=>{const _=this.resolveTriangleIndex(g);_e(o,_*3,a,l)}:g=>{_e(o,g*3,a,l)},h=cn.getPrimitive(),f=t.geometry.index,u=t.geometry.attributes.position,d=t.indirect?g=>{const _=t.resolveTriangleIndex(g);_e(h,_*3,f,u)}:g=>{_e(h,g*3,f,u)};if(r){const g=(_,m,p,M,x,E,A,b)=>{for(let S=p,P=p+M;S<P;S++){d(S),h.a.applyMatrix4(e),h.b.applyMatrix4(e),h.c.applyMatrix4(e),h.needsUpdate=!0;for(let T=_,v=_+m;T<v;T++)if(c(T),o.needsUpdate=!0,r(o,h,T,S,x,E,A,b))return!0}return!1};if(s){const _=s;s=function(m,p,M,x,E,A,b,S){return _(m,p,M,x,E,A,b,S)?!0:g(m,p,M,x,E,A,b,S)}}else s=g}return Y0(this,t,e,s)}intersectsBox(t,e){return kr.set(t.min,t.max,e),kr.needsUpdate=!0,this.shapecast({intersectsBounds:n=>kr.intersectsBox(n),intersectsTriangle:n=>kr.intersectsTriangle(n)})}intersectsSphere(t){return this.shapecast({intersectsBounds:e=>t.intersectsBox(e),intersectsTriangle:e=>e.intersectsSphere(t)})}closestPointToGeometry(t,e,n={},s={},r=0,o=1/0){return(this.indirect?X0:N0)(this,t,e,n,s,r,o)}closestPointToPoint(t,e={},n=0,s=1/0){return _0(this,t,e,n,s)}getBoundingBox(t){return t.makeEmpty(),this._roots.forEach(n=>{pe(0,new Float32Array(n),Hc),t.union(Hc)}),t}}function Gc(i,t,e){return i===null?null:(i.point.applyMatrix4(t.matrixWorld),i.distance=i.point.distanceTo(e.ray.origin),i.object=t,i)}const Hr=new Js,Vc=new I,Wc=new Kt,K0=me.prototype.raycast,Xc=new I;function $0(i,t){if(this.geometry.boundsTree){if(this.material===void 0)return;Wc.copy(this.matrixWorld).invert(),Hr.copy(i.ray).applyMatrix4(Wc),Q0(this.matrixWorld,Xc),Vc.copy(Hr.direction).multiply(Xc);const e=Vc.length(),n=i.near/e,s=i.far/e,r=this.geometry.boundsTree;if(i.firstHitOnly===!0){const o=Gc(r.raycastFirst(Hr,this.material,n,s),this,i);o&&t.push(o)}else{const o=r.raycast(Hr,this.material,n,s);for(let a=0,l=o.length;a<l;a++){const c=Gc(o[a],this,i);c&&t.push(c)}}}else K0.call(this,i,t)}function Z0(i){return this.boundsTree=new Ka(this,i),this.boundsTree}function J0(){this.boundsTree=null}function Q0(i,t){const e=i.elements,n=t.set(e[0],e[1],e[2]).length(),s=t.set(e[4],e[5],e[6]).length(),r=t.set(e[8],e[9],e[10]).length();return t.set(n,s,r)}function tx(i,t=!1){const e=i[0].index!==null,n=new Set(Object.keys(i[0].attributes)),s=new Set(Object.keys(i[0].morphAttributes)),r={},o={},a=i[0].morphTargetsRelative,l=new We;let c=0;for(let h=0;h<i.length;++h){const f=i[h];let u=0;if(e!==(f.index!==null))return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+h+". All geometries must have compatible attributes; make sure index attribute exists among all geometries, or in none of them."),null;for(const d in f.attributes){if(!n.has(d))return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+h+'. All geometries must have compatible attributes; make sure "'+d+'" attribute exists among all geometries, or in none of them.'),null;r[d]===void 0&&(r[d]=[]),r[d].push(f.attributes[d]),u++}if(u!==n.size)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+h+". Make sure all geometries have the same number of attributes."),null;if(a!==f.morphTargetsRelative)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+h+". .morphTargetsRelative must be consistent throughout all geometries."),null;for(const d in f.morphAttributes){if(!s.has(d))return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+h+".  .morphAttributes must be consistent throughout all geometries."),null;o[d]===void 0&&(o[d]=[]),o[d].push(f.morphAttributes[d])}if(t){let d;if(e)d=f.index.count;else if(f.attributes.position!==void 0)d=f.attributes.position.count;else return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+h+". The geometry must have either an index or a position attribute"),null;l.addGroup(c,d,h),c+=d}}if(e){let h=0;const f=[];for(let u=0;u<i.length;++u){const d=i[u].index;for(let g=0;g<d.count;++g)f.push(d.getX(g)+h);h+=i[u].attributes.position.count}l.setIndex(f)}for(const h in r){const f=qc(r[h]);if(!f)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed while trying to merge the "+h+" attribute."),null;l.setAttribute(h,f)}for(const h in o){const f=o[h][0].length;if(f===0)break;l.morphAttributes=l.morphAttributes||{},l.morphAttributes[h]=[];for(let u=0;u<f;++u){const d=[];for(let _=0;_<o[h].length;++_)d.push(o[h][_][u]);const g=qc(d);if(!g)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed while trying to merge the "+h+" morphAttribute."),null;l.morphAttributes[h].push(g)}}return l}function qc(i){let t,e,n,s=-1,r=0;for(let c=0;c<i.length;++c){const h=i[c];if(t===void 0&&(t=h.array.constructor),t!==h.array.constructor)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.array must be of consistent array types across matching attributes."),null;if(e===void 0&&(e=h.itemSize),e!==h.itemSize)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.itemSize must be consistent across matching attributes."),null;if(n===void 0&&(n=h.normalized),n!==h.normalized)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.normalized must be consistent across matching attributes."),null;if(s===-1&&(s=h.gpuType),s!==h.gpuType)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.gpuType must be consistent across matching attributes."),null;r+=h.count*e}const o=new t(r),a=new Je(o,e,n);let l=0;for(let c=0;c<i.length;++c){const h=i[c];if(h.isInterleavedBufferAttribute){const f=l/e;for(let u=0,d=h.count;u<d;u++)for(let g=0;g<e;g++){const _=h.getComponent(u,g);a.setComponent(u+f,g,_)}}else o.set(h.array,l);l+=h.count*e}return s!==void 0&&(a.gpuType=s),a}const Yc=2.1;function ex(i){return Math.atan2(-(i.z2-i.z1),i.x2-i.x1)}function eh(i){const t=[];for(const e of i.walls){const n=Math.hypot(e.x2-e.x1,e.z2-e.z1),s=ex(e),r=i.doors.filter(l=>l.wallId===e.id).map(l=>({a:l.offset-l.width/2,b:l.offset+l.width/2,width:l.width})).sort((l,c)=>l.a-c.a);let o=0;const a=[];for(const l of r){const c=Math.max(0,l.a),h=Math.min(n,l.b);c>o&&a.push([o,c]),o=Math.max(o,h),t.push({cx:e.x1+(c+h)/2/n*(e.x2-e.x1),cz:e.z1+(c+h)/2/n*(e.z2-e.z1),hx:(h-c)/2,hz:e.thickness/2,angle:s,y0:Yc,h:Math.max(.01,e.height-Yc)})}o<n&&a.push([o,n]);for(const[l,c]of a)c-l<.01||t.push({cx:e.x1+(l+c)/2/n*(e.x2-e.x1),cz:e.z1+(l+c)/2/n*(e.z2-e.z1),hx:(c-l)/2,hz:e.thickness/2,angle:s,y0:0,h:e.height})}for(const e of i.pillars)t.push({cx:e.x,cz:e.z,hx:e.w/2,hz:e.d/2,angle:0,y0:0,h:e.h});return t}function nx(i,t=.05,e=1.1){const n=[];for(const s of i){if(s.y0>e||s.y0+s.h<t)continue;const r=Math.cos(s.angle),o=Math.sin(s.angle),l=[[-s.hx,-s.hz],[s.hx,-s.hz],[s.hx,s.hz],[-s.hx,s.hz]].map(([c,h])=>({x:s.cx+c*r+h*o,z:s.cz-c*o+h*r}));for(let c=0;c<4;c++){const h=l[c],f=l[(c+1)%4];n.push({x1:h.x,z1:h.z,x2:f.x,z2:f.z})}}return n}function ix(i){const t=new Cn(i.hx*2,i.h,i.hz*2),e=new Kt().makeRotationY(i.angle).setPosition(i.cx,i.y0+i.h/2,i.cz);return t.applyMatrix4(e),t}function sx(i,t){const e=new ii,{x1:n,z1:s,x2:r,z2:o}=i.bounds,a=new me(new Qs(r-n+20,o-s+20),new si({color:10334346}));a.rotation.x=-Math.PI/2,a.position.set((n+r)/2,-.01,(s+o)/2),a.receiveShadow=!0,e.add(a);for(const u of i.floors){if(u.h<=.01)continue;const d=new me(new Cn(u.x2-u.x1,u.h,u.z2-u.z1),new si({color:13617336}));d.position.set((u.x1+u.x2)/2,u.h/2,(u.z1+u.z2)/2),e.add(d)}const l=new si({color:12101768});for(const u of i.ramps){const d=Math.hypot(u.length,u.rise),g=new Cn(u.width,.12,d),_=new me(g,l),m=Math.atan2(-u.dirZ,u.dirX)+Math.PI/2,p=Math.atan2(u.rise,u.length);_.rotation.order="YXZ",_.rotation.y=m,_.rotation.x=-p;const M=u.rise/2;_.position.set(u.cx,M-.06*Math.cos(p),u.cz),e.add(_)}const c=t.map(ix),h=tx(c,!1);c.forEach(u=>u.dispose()),h.computeBoundsTree();const f=new me(h,new si({color:14209732}));return f.castShadow=!0,f.receiveShadow=!0,e.add(f),{group:e,bvhMesh:f,colliderCount:t.length}}function Bn(i,t,e){for(const s of i.ramps){const r=t-s.cx,o=e-s.cz,a=r*s.dirX+o*s.dirZ,l=-r*s.dirZ+o*s.dirX;if(a>=-s.length/2&&a<=s.length/2+.6&&Math.abs(l)<=s.width/2)return Math.min(1,(a+s.length/2)/s.length)*s.rise}let n=0;for(const s of i.floors)t>=s.x1&&t<=s.x2&&e>=s.z1&&e<=s.z2&&(n=Math.max(n,s.h));return n}const nn=.1;class jc{constructor(t){this.segs=t,this.buckets=new Map,this.cell=2,t.forEach((e,n)=>{const s=Math.floor(Math.min(e.x1,e.x2)/this.cell),r=Math.floor(Math.max(e.x1,e.x2)/this.cell),o=Math.floor(Math.min(e.z1,e.z2)/this.cell),a=Math.floor(Math.max(e.z1,e.z2)/this.cell);for(let l=s;l<=r;l++)for(let c=o;c<=a;c++){const h=l+","+c;let f=this.buckets.get(h);f||this.buckets.set(h,f=[]),f.push(this.segs[n])}})}dist(t,e,n=3){const s=Math.floor(t/this.cell),r=Math.floor(e/this.cell),o=Math.ceil(n/this.cell);let a=n;for(let l=s-o;l<=s+o;l++)for(let c=r-o;c<=r+o;c++){const h=this.buckets.get(l+","+c);if(h)for(const f of h){const u=nh(t,e,f);u<a&&(a=u)}}return a}}function nh(i,t,e){const n=e.x2-e.x1,s=e.z2-e.z1,r=n*n+s*s;let o=r>0?((i-e.x1)*n+(t-e.z1)*s)/r:0;o=Math.max(0,Math.min(1,o));const a=e.x1+o*n,l=e.z1+o*s;return Math.hypot(i-a,t-l)}function rx(i,t,e){const{x1:n,z1:s,x2:r,z2:o}=i.bounds,a=n-1,l=s-1,c=Math.ceil((r-n+2)/nn),h=Math.ceil((o-s+2)/nn),f=new Uint8Array(c*h),u=e;for(const d of t){const g=Math.max(0,Math.floor((Math.min(d.x1,d.x2)-u-a)/nn)),_=Math.min(c-1,Math.ceil((Math.max(d.x1,d.x2)+u-a)/nn)),m=Math.max(0,Math.floor((Math.min(d.z1,d.z2)-u-l)/nn)),p=Math.min(h-1,Math.ceil((Math.max(d.z1,d.z2)+u-l)/nn));for(let M=m;M<=p;M++)for(let x=g;x<=_;x++){const E=M*c+x;f[E]||nh(a+x*nn,l+M*nn,d)<u&&(f[E]=1)}}return{ox:a,oz:l,w:c,h,blocked:f}}function ox(i,t,e,n,s){const{w:r,h:o,blocked:a,ox:l,oz:c}=i,h=(L,D)=>[Math.round((L-l)/nn),Math.round((D-c)/nn)];let[f,u]=h(t,e),[d,g]=h(n,s);const _=(L,D)=>Math.max(0,Math.min(D-1,L));f=_(f,r),u=_(u,o),d=_(d,r),g=_(g,o);const m=(L,D)=>{if(!a[D*r+L])return[L,D];for(let N=1;N<40;N++)for(let z=-N;z<=N;z++)for(let O=-N;O<=N;O++){if(Math.max(Math.abs(O),Math.abs(z))!==N)continue;const Y=L+O,B=D+z;if(Y>=0&&Y<r&&B>=0&&B<o&&!a[B*r+Y])return[Y,B]}return[L,D]};[f,u]=m(f,u),[d,g]=m(d,g);const p=u*r+f,M=g*r+d,x=new Float32Array(r*o).fill(1/0),E=new Int32Array(r*o).fill(-1),A=new Uint8Array(r*o);x[p]=0;const b=[],S=[],P=(L,D)=>{b.push(L),S.push(D);let N=b.length-1;for(;N>0;){const z=N-1>>1;if(b[z]<=b[N])break;[b[z],b[N]]=[b[N],b[z]],[S[z],S[N]]=[S[N],S[z]],N=z}},T=()=>{const L=S[0],D=b.pop(),N=S.pop();if(b.length){b[0]=D,S[0]=N;let z=0;for(;;){let O=z;const Y=2*z+1,B=Y+1;if(Y<b.length&&b[Y]<b[O]&&(O=Y),B<b.length&&b[B]<b[O]&&(O=B),O===z)break;[b[O],b[z]]=[b[z],b[O]],[S[O],S[z]]=[S[z],S[O]],z=O}}return L},v=L=>{const D=Math.abs(L%r-d),N=Math.abs((L/r|0)-g);return D+N+(Math.SQRT2-2)*Math.min(D,N)};P(v(p),p);const R=[[1,0,1],[-1,0,1],[0,1,1],[0,-1,1],[1,1,Math.SQRT2],[1,-1,Math.SQRT2],[-1,1,Math.SQRT2],[-1,-1,Math.SQRT2]];for(;b.length;){const L=T();if(L===M){const z=[];let O=L;for(;O!==-1;)z.push({x:l+O%r*nn,z:c+(O/r|0)*nn}),O=E[O];return z.reverse(),z[0]={x:t,z:e},z[z.length-1]={x:n,z:s},z}if(A[L])continue;A[L]=1;const D=L%r,N=L/r|0;for(const[z,O,Y]of R){const B=D+z,it=N+O;if(B<0||B>=r||it<0||it>=o)continue;const st=it*r+B;if(a[st]||A[st]||z!==0&&O!==0&&(a[N*r+B]||a[it*r+D]))continue;const ht=x[L]+Y;ht<x[st]&&(x[st]=ht,E[st]=L,P(ht+v(st),st))}}return null}function Pi(i,t,e,n){const s=Math.hypot(e.x-t.x,e.z-t.z),r=Math.max(1,Math.ceil(s/.1));for(let o=0;o<=r;o++){const a=o/r,l={x:t.x+(e.x-t.x)*a,z:t.z+(e.z-t.z)*a};if(i.dist(l.x,l.z,n(l))<n(l))return!1}return!0}function pa(i,t,e){if(i.length<=2)return i;const n=[i[0]];let s=0;for(;s<i.length-1;){let r=i.length-1;for(;r>s+1&&!Pi(t,i[s],i[r],e);)r--;n.push(i[r]),s=r}return n}function ax(i){const t=[];for(const e of i.ramps){const n=-e.dirZ,s=e.dirX,r=e.dirX*e.length/2,o=e.dirZ*e.length/2;for(const a of[1,-1]){const l=n*(e.width/2)*a,c=s*(e.width/2)*a;t.push({x1:e.cx-r+l,z1:e.cz-o+c,x2:e.cx+r+l,z2:e.cz+o+c})}}return t}function lx(i,t){const e=[];for(const n of i.doors){const s=i.walls.find(u=>u.id===n.wallId);if(!s)continue;const r=Math.hypot(s.x2-s.x1,s.z2-s.z1),o=(s.x2-s.x1)/r,a=(s.z2-s.z1)/r,l=s.x1+o*n.offset,c=s.z1+a*n.offset,h=-a,f=o;for(let u=1;u<t.length;u++){const d=t[u-1],g=t[u],_=g.x-d.x,m=g.z-d.z,p=_*a-m*o;if(Math.abs(p)<1e-9)continue;const M=((l-d.x)*a-(c-d.z)*o)/p;if(M<0||M>1)continue;const x=(d.x+_*M-l)*o+(d.z+m*M-c)*a;if(Math.abs(x)>n.width/2)continue;const E=Math.sign((g.x-d.x)*h+(g.z-d.z)*f)||1;e.push({rawIndex:u,pinIn:{x:l-h*E*.75,z:c-f*E*.75},pinOut:{x:l+h*E*.75,z:c+f*E*.75}});break}}return e.sort((n,s)=>n.rawIndex-s.rawIndex),e}function cx(i,t,e,n){const s=new Set;if(t.length===0)return{pts:pa(i,e,n),pinSet:s};const r=[];let o=0;for(const c of t){s.add(c.pinIn).add(c.pinOut);const h=i.slice(o,c.rawIndex);r.length&&(h[0]=r[r.length-1]),h.push(c.pinIn);const f=pa(h,e,n);for(let u=r.length?1:0;u<f.length;u++)r.push(f[u]);r.push(c.pinOut),o=c.rawIndex}const a=i.slice(o);r.length&&(a[0]=r[r.length-1]);const l=pa(a,e,n);for(let c=r.length?1:0;c<l.length;c++)r.push(l[c]);return{pts:r,pinSet:s}}function ux(i,t,e,n){if(i.length<3)return i;const s=[i[0]];for(let r=1;r<i.length-1;r++){const o=i[r];if(t.has(o)){s.push(o);continue}const a=s[s.length-1],l=i[r+1],c=Math.hypot(o.x-a.x,o.z-a.z);if(c<.6&&Pi(e,a,l,n))continue;const h=Math.hypot(l.x-o.x,l.z-o.z);c>1e-6&&h>1e-6&&((o.x-a.x)*(l.x-o.x)+(o.z-a.z)*(l.z-o.z))/(c*h)>Math.cos(.12)&&Pi(e,a,l,n)||s.push(o)}return s.push(i[i.length-1]),s}function hx(i,t,e,n){if(i.length<3)return i;const s=[i[0]];let r=1;for(;r<i.length-1;){if(t.has(i[r])){s.push(i[r]),r++;continue}const o=[];let a=r;for(;a<i.length-1&&!t.has(i[a])&&(o.length===0||Math.hypot(i[a].x-o[o.length-1].x,i[a].z-o[o.length-1].z)<1.2&&Math.hypot(i[a].x-o[0].x,i[a].z-o[0].z)<2);)o.push(i[a]),a++;if(o.length===1){s.push(o[0]),r=a;continue}const l={x:o.reduce((m,p)=>m+p.x,0)/o.length,z:o.reduce((m,p)=>m+p.z,0)/o.length},c=s[s.length-1],h=i[a],f=Qn(o[0].x-c.x,o[0].z-c.z),u=Qn(h.x-o[o.length-1].x,h.z-o[o.length-1].z),d=Math.hypot(f.x-u.x,f.z-u.z)||1,g={x:(f.x-u.x)/d,z:(f.z-u.z)/d};let _=null;for(const m of[0,.4,.8,1.2,1.6]){const p=m===0?l:{x:l.x+g.x*m,z:l.z+g.z*m};if(Pi(e,c,p,n)&&Pi(e,p,h,n)){_=p;break}}_?s.push(_):s.push(...o),r=a}return s.push(i[i.length-1]),s}function fx(i,t){for(const e of i.ramps){const n=t.x-e.cx,s=t.z-e.cz,r=n*e.dirX+s*e.dirZ,o=-n*e.dirZ+s*e.dirX,a=Math.abs(o);if(a>e.width/2&&a<e.width/2+.6&&Math.abs(r)<=e.length/2&&(r+e.length/2)/e.length*e.rise>.03)return!0}return!1}function dx(i,t,e,n,s,r,o,a=[]){if(i.length<3)return i;const l=[i[0]],c=()=>s,h=(u,d,g,_,m,p,M)=>{const x=Math.hypot(d.x-u.x,d.z-u.z),E=Math.hypot(g.x-d.x,g.z-d.z),A=M*Math.tan(p/2);if(A>x*.9||A>E*.9)return null;const b={x:d.x-_.x*A,z:d.z-_.z*A},S={x:d.x+m.x*A,z:d.z+m.z*A},P={x:-_.z,z:_.x},T={x:b.x+P.x*M,z:b.z+P.z*M},v={x:b.x-P.x*M,z:b.z-P.z*M},R=ma(T,S)<ma(v,S)?T:v,L=Math.atan2(b.z-R.z,b.x-R.x);let N=Math.atan2(S.z-R.z,S.x-R.x)-L;for(;N>Math.PI;)N-=2*Math.PI;for(;N<-Math.PI;)N+=2*Math.PI;const z=Math.max(3,Math.ceil(Math.abs(N)/.15)),O=[];for(let Y=0;Y<=z;Y++){const B=L+N*Y/z,it={x:R.x+M*Math.cos(B),z:R.z+M*Math.sin(B)};if(e.dist(it.x,it.z,s)<s||fx(n,it))return null;O.push(it)}return O},f=(u,d,g,_)=>{const m=Qn(d.x-u.x,d.z-u.z),p=Qn(g.x-d.x,g.z-d.z),M=Math.hypot(m.x-p.x,m.z-p.z)||1,x={x:(m.x-p.x)/M,z:(m.z-p.z)/M};for(const E of[0,.3,.6,.9,1.2,1.6]){const A=E===0?d:{x:d.x+x.x*E,z:d.z+x.z*E},b=Qn(A.x-u.x,A.z-u.z),S=Qn(g.x-A.x,g.z-A.z),P=Math.max(-1,Math.min(1,b.x*S.x+b.z*S.z)),T=Math.acos(P);if(!(T<.12)&&!(E>0&&(!Pi(t,u,A,c)||!Pi(t,A,g,c))))for(const v of _){const R=h(u,A,g,b,S,T,v);if(R)return R}}return null};for(let u=1;u<i.length-1;u++){const d=i[u],g=i[u+1];if(a.some(p=>ma(p,d)<1.44)){l.push(d);continue}const _=l[l.length-1];let m=f(_,d,g,[r]);if(!m){const p=Qn(d.x-_.x,d.z-_.z),M=Qn(g.x-d.x,g.z-d.z),x=Math.max(-1,Math.min(1,p.x*M.x+p.z*M.z));Math.acos(x)>=.12&&o.push({x:d.x,z:d.z,radius:r}),m=f(_,d,g,[r*.7,r*.5,.3])}if(m)for(const p of m)l.push(p);else l.push(d)}return l.push(i[i.length-1]),l}function Qn(i,t){const e=Math.hypot(i,t)||1;return{x:i/e,z:t/e}}function ma(i,t){return(i.x-t.x)**2+(i.z-t.z)**2}function px(i,t){if(i.length<2)return i;const e=[i[0]];let n=0;for(let o=1;o<i.length;o++){const a=i[o-1],l=i[o],c=Math.hypot(l.x-a.x,l.z-a.z);let h=t-n;for(;h<=c;)e.push({x:a.x+(l.x-a.x)*h/c,z:a.z+(l.z-a.z)*h/c}),h+=t;n=c-(h-t)}const s=i[i.length-1],r=e[e.length-1];return Math.hypot(s.x-r.x,s.z-r.z)>.01&&e.push(s),e}function mx(i,t,e,n){const s=eh(i),r=nx(s),o=r.concat(ax(i)),a=new jc(o),l=new jc(r),c=t.width/2+.02,h=rx(i,o,c),f=ox(h,e.x,e.z,n.x,n.z);if(!f)return null;const u=i.doors.map(A=>{const b=i.walls.find(P=>P.id===A.wallId);if(!b)return null;const S=Math.hypot(b.x2-b.x1,b.z2-b.z1);return{x:b.x1+(b.x2-b.x1)/S*A.offset,z:b.z1+(b.z2-b.z1)/S*A.offset}}).filter(A=>A!==null),d=()=>c,g=lx(i,f),{pts:_,pinSet:m}=cx(f,g,a,d),p=ux(_,m,a,d),M=hx(p,m,a,d),x=[],E=dx(M,a,l,i,c,t.turnRadius,x,u);return{smooth:E,samples:px(E,.25),turnIssues:x}}const Kc=.25,$c=6,Zc=1/12,Jc=1.03;function gx(i,t,e,n,s){const r=i.length;if(r<2)return[];const o=new ju;o.firstHitOnly=!0,o.far=$c;const a=new Float32Array(r),l=new Float32Array(r),c=new Float32Array(r);for(let x=0;x<r;x++)c[x]=Bn(t,i[x].x,i[x].z);const h=new I,f=new I;for(let x=0;x<r;x++){const E=i[x],A=i[Math.min(r-1,x+1)],b=i[Math.max(0,x-1)];let S=A.x-b.x,P=A.z-b.z;const T=Math.hypot(S,P)||1;S/=T,P/=T;let v=0;for(const R of[1,-1]){h.set(E.x,c[x]+.6,E.z),f.set(-P*R,0,S*R).normalize(),o.set(h,f);const L=o.intersectObject(n,!1);v+=L.length?L[0].distance:$c}a[x]=v,x>0&&x<r-1&&(l[x]=(c[x+1]-c[x-1])/(2*Kc))}l[0]=l[1],l[r-1]=l[r-2];const u=Math.max(1,Math.round(e.length/2/Kc)),d=new Float32Array(r);for(let x=0;x<r;x++){let E=1/0;const A=Math.max(0,x-u),b=Math.min(r-1,x+u);for(let S=A;S<=b;S++)a[S]<E&&(E=a[S]);d[x]=E}const g=new Array(r).fill(!1),_=new Array(r).fill(!1);for(let x=0;x<r;x++)d[x]<e.threshold&&(g[x]=!0),Math.abs(l[x])>Zc*Jc&&(_[x]=!0);const m=[];let p=1;const M=(x,E)=>{let A=0;for(;A<r;){if(!x[A]){A++;continue}let b=A;for(;;){let R=b+1,L=0;for(;R<r&&!x[R]&&L<2;)R++,L++;if(R<r&&x[R])b=R;else break}const S=i[A+b>>1];let P=1/0,T=0;for(let R=A;R<=b;R++)d[R]<P&&(P=d[R]),Math.abs(l[R])>T&&(T=Math.abs(l[R]));const v=[];E&&P<e.threshold&&v.push(`净宽不足：${P.toFixed(2)}m < ${e.threshold.toFixed(2)}m`),!E&&T>Zc*Jc&&v.push(`坡度超限：1:${(1/T).toFixed(1)} 陡于 1:12（${(T*100).toFixed(1)}%）`),v.length&&m.push({id:p++,x:S.x,z:S.z,clearWidth:P,slope:T,reasons:v}),A=b+1}};M(g,!0),M(_,!1);for(const x of s)m.push({id:p++,x:x.x,z:x.z,clearWidth:1/0,slope:0,reasons:[`转弯半径不足：无法布置 R=${x.radius.toFixed(1)}m 转弯圆弧`]});return m}const cs=[];function hn(i,t=An){let e;const n=new Set;function s(a){if(za(i,a)&&(i=a,e)){const l=!cs.length;for(const c of n)c[1](),cs.push(c,i);if(l){for(let c=0;c<cs.length;c+=2)cs[c][0](cs[c+1]);cs.length=0}}}function r(a){s(a(i))}function o(a,l=An){const c=[a,l];return n.add(c),n.size===1&&(e=t(s,r)||An),a(i),()=>{n.delete(c),n.size===0&&e&&(e(),e=null)}}return{set:s,update:r,subscribe:o}}const Tn=hn({width:.72,length:1.15,turnRadius:1.5,threshold:.9}),yi=hn([]),qr=hn(null),gn=hn("就绪：点击“设置起点/终点”后在平面图上点选"),Hs=hn({colliders:0,fps:0,pathLen:0}),Yr=hn("free"),Ys=hn(!1),js=hn("none"),jr=hn(!1),Kr=hn(!1),Gs=hn(null),Vs=hn(null);We.prototype.computeBoundsTree=Z0;We.prototype.disposeBoundsTree=J0;me.prototype.raycast=$0;const ga=1.6;class _x{constructor(t){this.canvas=t,this.clock=new W_,this.plan=null,this.boxes=[],this.planGroup=null,this.bvhMesh=null,this.handlesGroup=new ii,this.markersGroup=new ii,this.pathLine=null,this.path=null,this.start=null,this.end=null,this.raycaster=new ju,this.groundPlane=new _n(new I(0,1,0),0),this.dragging=null,this.geomDirty=!1,this.roamT=0,this.pathLengths=[],this.pathTotal=0,this.frames=0,this.fpsTimer=0,this.resize=()=>{const n=this.canvas.clientWidth||window.innerWidth,s=this.canvas.clientHeight||window.innerHeight;this.renderer.setSize(n,s,!1),this.camera.aspect=n/s,this.camera.updateProjectionMatrix()},this.onPointerDown=n=>{if(n.button!==0||!this.plan)return;this.raycaster.setFromCamera(this.ndc(n),this.camera);const s=Ln(js);if(s!=="none"){const a=new I;if(this.raycaster.ray.intersectPlane(this.groundPlane,a)){const l={x:a.x,z:a.z};s==="start"?(this.start=l,Gs.set(l),this.startPost.position.set(l.x,Bn(this.plan,l.x,l.z)+.6,l.z),this.startPost.visible=!0):(this.end=l,Vs.set(l),this.endPost.position.set(l.x,Bn(this.plan,l.x,l.z)+.6,l.z),this.endPost.visible=!0),js.set("none"),this.start&&this.end?this.solve():gn.set("已设置一点，请再设置另一点")}return}const r=this.raycaster.intersectObjects(this.handlesGroup.children,!1);if(r.length){const a=r[0].object.userData;a.type==="door"?this.dragging={type:"door",doorId:a.doorId,side:a.side}:this.dragging={type:"ramp",rampId:a.rampId},this.controls.enabled=!1;return}const o=this.raycaster.intersectObjects(this.markersGroup.children,!0);if(o.length){let a=o[0].object;for(;a&&a.userData.blockageId===void 0;)a=a.parent;if(a){const l=Ln(yi).find(c=>c.id===a.userData.blockageId);l&&(qr.set(l),gn.set(`卡点 #${l.id}：${l.reasons.join("；")}`))}}},this.onPointerMove=n=>{if(!this.dragging||!this.plan)return;this.raycaster.setFromCamera(this.ndc(n),this.camera);const s=new I;if(this.raycaster.ray.intersectPlane(this.groundPlane,s)){if(this.dragging.type==="door"){const r=this.plan.doors.find(p=>p.id===this.dragging.doorId);if(!r)return;const o=this.plan.walls.find(p=>p.id===r.wallId),a=Math.hypot(o.x2-o.x1,o.z2-o.z1),l=(o.x2-o.x1)/a,c=(o.z2-o.z1)/a,h=(s.x-o.x1)*l+(s.z-o.z1)*c,f=this.dragging.side,d=r.offset-f*r.width/2,g=f*(h-d)>0?Math.abs(h-d)/2:r.width/2,_=Math.max(.6,Math.min(3,g*2)),m=d+f*_/2;if(m-_/2<.2||m+_/2>a-.2)return;r.offset=m,r.width=Math.round(_*100)/100}else{const r=this.plan.ramps.find(h=>h.id===this.dragging.rampId);if(!r)return;const o=r.cx+r.dirX*r.length/2,a=r.cz+r.dirZ*r.length/2,l=(s.x-o)*-r.dirX+(s.z-a)*-r.dirZ,c=Math.max(2,Math.min(14,l));r.length=Math.round(c*10)/10,r.cx=o-r.dirX*r.length/2,r.cz=a-r.dirZ*r.length/2}this.geomDirty=!0}},this.onPointerUp=()=>{this.dragging&&(this.dragging=null,this.controls.enabled=!0,this.start&&this.end&&this.solve(),gn.set("构件已调整，路径与卡点已重新计算"))},this.tick=()=>{const n=Math.min(this.clock.getDelta(),.1);this.geomDirty&&(this.geomDirty=!1,this.rebuildGeometry());const s=Ln(Yr),r=Ln(Ys);if(s!=="free"&&this.path&&this.pathTotal>0){r&&(this.roamT+=n*1.4,this.roamT>this.pathTotal&&(this.roamT=0));const{pos:o,dir:a}=this.pathPointAt(this.roamT);s==="top"?(this.camera.position.set(o.x,o.y+16,o.z+.01),this.camera.lookAt(o)):(this.camera.position.set(o.x,o.y+1.2,o.z),this.camera.lookAt(o.x+a.x*2.5,o.y+1.1,o.z+a.z*2.5))}else this.controls.update();this.renderer.render(this.scene,this.camera),this.frames++,this.fpsTimer+=n,this.fpsTimer>=1&&(Hs.update(o=>({...o,fps:Math.round(this.frames/this.fpsTimer)})),this.frames=0,this.fpsTimer=0)},this.renderer=new O_({canvas:t,antialias:!0}),this.renderer.setPixelRatio(Math.min(window.devicePixelRatio,2)),this.renderer.shadowMap.enabled=!0,this.scene=new z_,this.scene.background=new jt(1712688),this.scene.fog=new Xa(1712688,80,220),this.camera=new sn(55,1,.1,500),this.camera.position.set(35,55,75),this.controls=new q_(this.camera,t),this.controls.target.set(35,0,25),this.controls.maxPolarAngle=Math.PI/2-.02;const e=new G_(16777215,1.6);e.position.set(40,60,20),e.castShadow=!0,e.shadow.mapSize.set(2048,2048),e.shadow.camera.left=-60,e.shadow.camera.right=60,e.shadow.camera.top=60,e.shadow.camera.bottom=-60,this.scene.add(e),this.scene.add(new V_(16777215,.55)),this.scene.add(this.handlesGroup),this.scene.add(this.markersGroup),this.startPost=this.makePost(3066993),this.endPost=this.makePost(3447003),this.startPost.visible=this.endPost.visible=!1,this.scene.add(this.startPost,this.endPost),t.addEventListener("pointerdown",this.onPointerDown),t.addEventListener("pointermove",this.onPointerMove),window.addEventListener("pointerup",this.onPointerUp),this.resize(),window.addEventListener("resize",this.resize),this.renderer.setAnimationLoop(this.tick)}makePost(t){const e=new me(new ao(.12,.12,1.2,12),new si({color:t}));return e.position.y=.6,e}loadPlan(t){this.plan=t,this.start=this.end=null,Gs.set(null),Vs.set(null),this.startPost.visible=this.endPost.visible=!1,this.clearPath(),this.rebuildGeometry(),jr.set(!0),gn.set(`已载入「${t.name}」，碰撞体 ${this.boxes.length} 个。请设置起点和终点`)}rebuildGeometry(){if(!this.plan)return;this.planGroup&&(this.scene.remove(this.planGroup),this.planGroup.traverse(e=>{var n,s;e instanceof me&&((s=(n=e.geometry).disposeBoundsTree)==null||s.call(n),e.geometry.dispose())})),this.boxes=eh(this.plan);const t=sx(this.plan,this.boxes);this.planGroup=t.group,this.bvhMesh=t.bvhMesh,this.scene.add(this.planGroup),this.buildHandles(),Hs.update(e=>({...e,colliders:t.colliderCount}))}buildHandles(){if(this.handlesGroup.clear(),!this.plan)return;const t=new si({color:15965202,emissive:6699520}),e=new si({color:3447003,emissive:666180});for(const n of this.plan.doors){const s=this.plan.walls.find(l=>l.id===n.wallId);if(!s)continue;const r=Math.hypot(s.x2-s.x1,s.z2-s.z1),o=(s.x2-s.x1)/r,a=(s.z2-s.z1)/r;for(const l of[-1,1]){const c=n.offset+l*n.width/2,h=new me(new Cn(.35,.35,.35),t);h.position.set(s.x1+o*c,1,s.z1+a*c),h.userData={handle:!0,type:"door",doorId:n.id,side:l},this.handlesGroup.add(h)}}for(const n of this.plan.ramps){const s=n.cx-n.dirX*n.length/2,r=n.cz-n.dirZ*n.length/2,o=new me(new Cn(.4,.4,.4),e);o.position.set(s,.35,r),o.userData={handle:!0,type:"ramp",rampId:n.id},this.handlesGroup.add(o)}}solve(){if(!this.plan||!this.start||!this.end)return;const t=performance.now(),e=mx(this.plan,Ln(Tn),this.start,this.end);if(!e){this.clearPath(),gn.set("未找到可行路径：请检查轮椅宽度参数或调整门宽/坡道");return}this.path=e,this.buildPathLine(),this.sweepAndMark(),this.roamT=0,Kr.set(!0);let n=0;for(let s=1;s<e.smooth.length;s++)n+=Math.hypot(e.smooth[s].x-e.smooth[s-1].x,e.smooth[s].z-e.smooth[s-1].z);Hs.update(s=>({...s,pathLen:Math.round(n*10)/10})),gn.set(`路径已生成（${(performance.now()-t).toFixed(0)}ms），全长 ${n.toFixed(1)}m，发现 ${Ln(yi).length} 处卡点`)}sweepAndMark(){if(!this.plan||!this.path||!this.bvhMesh)return;const t=gx(this.path.samples,this.plan,Ln(Tn),this.bvhMesh,this.path.turnIssues);yi.set(t),this.rebuildMarkers(t)}rebuildMarkers(t){this.markersGroup.clear();const e=new si({color:15158332,emissive:5902088}),n=new ao(.08,.08,ga,10),s=new qa(.16,12,8);for(const r of t){const o=new ii,a=this.plan?Bn(this.plan,r.x,r.z):0,l=new me(n,e);l.position.y=ga/2;const c=new me(s,e);c.position.y=ga+.12,o.add(l,c),o.position.set(r.x,a,r.z),o.userData={blockageId:r.id},this.markersGroup.add(o)}}buildPathLine(){if(this.pathLine&&(this.scene.remove(this.pathLine),this.pathLine.geometry.dispose()),!this.plan||!this.path)return;const t=this.path.smooth.map(n=>new I(n.x,Bn(this.plan,n.x,n.z)+.06,n.z)),e=new We().setFromPoints(t);this.pathLine=new B_(e,new qu({color:58879})),this.scene.add(this.pathLine),this.pathLengths=[0];for(let n=1;n<t.length;n++)this.pathLengths.push(this.pathLengths[n-1]+t[n].distanceTo(t[n-1]));this.pathTotal=this.pathLengths[this.pathLengths.length-1]||0}clearPath(){this.path=null,this.pathLine&&(this.scene.remove(this.pathLine),this.pathLine=null),this.markersGroup.clear(),yi.set([]),qr.set(null),Kr.set(!1),Hs.update(t=>({...t,pathLen:0}))}ndc(t){const e=this.canvas.getBoundingClientRect();return new At((t.clientX-e.left)/e.width*2-1,-((t.clientY-e.top)/e.height)*2+1)}setViewMode(t){Yr.set(t),this.controls.enabled=t==="free",t!=="free"?Ys.set(!0):Ys.set(!1)}pathPointAt(t){const e=this.path.smooth,n=this.pathLengths;let s=1;for(;s<n.length-1&&n[s]<t;)s++;const r=e[s-1],o=e[s],a=n[s]-n[s-1]||1,l=Math.max(0,Math.min(1,(t-n[s-1])/a)),c=r.x+(o.x-r.x)*l,h=r.z+(o.z-r.z)*l,f=this.plan?Bn(this.plan,c,h):0,u=Math.hypot(o.x-r.x,o.z-r.z)||1;return{pos:new I(c,f,h),dir:new I((o.x-r.x)/u,0,(o.z-r.z)/u)}}setPickMode(t){js.set(t),gn.set(t==="start"?"在平面图上点击选择起点":"在平面图上点击选择终点")}focusBlockage(t){qr.set(t);const e=this.plan?Bn(this.plan,t.x,t.z):0;Yr.set("free"),this.controls.enabled=!0,this.controls.target.set(t.x,e+1,t.z),this.camera.position.set(t.x+5,e+6,t.z+5),this.controls.update()}updateParams(t){Tn.set(t),this.start&&this.end&&this.solve()}exportData(){return{version:1,plan:this.plan,params:Ln(Tn),start:this.start,end:this.end,path:this.path?this.path.smooth:[],blockages:Ln(yi)}}importData(t){return!t||!t.plan||!Array.isArray(t.plan.walls)?"文件格式不正确：缺少 plan.walls":(this.plan=t.plan,t.params&&Tn.set(t.params),this.start=t.start??null,this.end=t.end??null,Gs.set(this.start),Vs.set(this.end),this.clearPath(),this.rebuildGeometry(),jr.set(!0),this.start&&this.startPost.position.set(this.start.x,Bn(this.plan,this.start.x,this.start.z)+.6,this.start.z),this.end&&this.endPost.position.set(this.end.x,Bn(this.plan,this.end.x,this.end.z)+.6,this.end.z),this.startPost.visible=!!this.start,this.endPost.visible=!!this.end,t.path&&t.path.length>=2?(this.path={smooth:t.path,samples:t.path,turnIssues:[]},this.buildPathLine(),yi.set(t.blockages??[]),this.rebuildMarkers(t.blockages??[]),Kr.set(!0),this.roamT=0):this.start&&this.end&&this.solve(),"")}importPlanOnly(t){return!t||!Array.isArray(t.walls)?"文件格式不正确":(this.plan=t,this.start=this.end=null,Gs.set(null),Vs.set(null),this.startPost.visible=this.endPost.visible=!1,this.clearPath(),this.rebuildGeometry(),jr.set(!0),"")}dispose(){this.renderer.setAnimationLoop(null),window.removeEventListener("resize",this.resize),window.removeEventListener("pointerup",this.onPointerUp)}}function xx(){const i=[{id:"pN",x1:0,z1:0,x2:70,z2:0,thickness:.3,height:2.6},{id:"pE",x1:70,z1:0,x2:70,z2:50,thickness:.3,height:2.6},{id:"pS",x1:70,z1:50,x2:0,z2:50,thickness:.3,height:2.6},{id:"pW",x1:0,z1:50,x2:0,z2:0,thickness:.3,height:2.6},{id:"aS",x1:8,z1:22,x2:28,z2:22,thickness:.25,height:3},{id:"aN",x1:28,z1:8,x2:8,z2:8,thickness:.25,height:3},{id:"aW",x1:8,z1:8,x2:8,z2:22,thickness:.25,height:3},{id:"aE",x1:28,z1:22,x2:28,z2:8,thickness:.25,height:3},{id:"bW",x1:42,z1:8,x2:42,z2:22,thickness:.25,height:3},{id:"bS",x1:42,z1:22,x2:62,z2:22,thickness:.25,height:3},{id:"bE",x1:62,z1:22,x2:62,z2:8,thickness:.25,height:3},{id:"bN",x1:62,z1:8,x2:42,z2:8,thickness:.25,height:3},{id:"cW",x1:33.5,z1:50,x2:33.5,z2:30,thickness:.2,height:2.8},{id:"cE",x1:36.5,z1:50,x2:36.5,z2:30,thickness:.2,height:2.8}],t=[{id:"gate",wallId:"pS",offset:35,width:3.5},{id:"doorA",wallId:"aS",offset:9.5,width:1},{id:"doorA2",wallId:"aN",offset:10,width:1.2},{id:"doorB",wallId:"bW",offset:7,width:.85}],e=[{id:"rampA",cx:17.5,cz:25.3,dirX:0,dirZ:-1,length:6,width:3,rise:.5},{id:"rampB",cx:39.3,cz:15,dirX:1,dirZ:0,length:5,width:2.5,rise:.6}],n=[];for(let r=6;r<=64;r+=2.5)r>14&&r<21||(n.push({x:r,z:26.5,w:.4,d:.4,h:2.8}),n.push({x:r,z:31.5,w:.4,d:.4,h:2.8}));for(let r=44;r<=64;r+=2.5)for(let o=28;o<=46;o+=2.5)n.push({x:r,z:o,w:.4,d:.4,h:2.8});for(let r=6;r<=64;r+=2.5)n.push({x:r,z:44,w:.35,d:.35,h:1.2}),n.push({x:r,z:4,w:.35,d:.35,h:1.2});for(let r=6;r<=64;r+=2)(r<14||r>21)&&(r<31||r>39)&&n.push({x:r,z:24.6,w:.25,d:.25,h:.9}),(r<31||r>39)&&n.push({x:r,z:33.5,w:.25,d:.25,h:.9});return{name:"示例社区平面",walls:i,doors:t,ramps:e,pillars:n,floors:[{x1:8,z1:8,x2:28,z2:22,h:.5},{x1:42,z1:8,x2:62,z2:22,h:.6}],bounds:{x1:0,z1:0,x2:70,z2:50}}}function Qc(i,t,e){const n=i.slice();return n[31]=t[e],n}function tu(i,t,e){const n=i.slice();return n[34]=t[e],n}function eu(i){let t,e,n=i[9]?"暂停":"播放",s,r,o;return{c(){t=bt("div"),e=bt("button"),s=Nt(n),dt(e,"class","svelte-1ovnsax"),dt(t,"class","row svelte-1ovnsax")},m(a,l){un(a,t,l),$(t,e),$(e,s),r||(o=xe(e,"click",i[29]),r=!0)},p(a,l){l[0]&512&&n!==(n=a[9]?"暂停":"播放")&&De(s,n)},d(a){a&&Ze(t),r=!1,o()}}}function nu(i){let t,e=i[11].pathLen+"",n,s;return{c(){t=Nt("· 路径长："),n=Nt(e),s=Nt(" m")},m(r,o){un(r,t,o),un(r,n,o),un(r,s,o)},p(r,o){o[0]&2048&&e!==(e=r[11].pathLen+"")&&De(n,e)},d(r){r&&(Ze(t),Ze(n),Ze(s))}}}function vx(i){let t,e=[],n=new Map,s=Zr(i[12]);const r=o=>o[34].id;for(let o=0;o<s.length;o+=1){let a=tu(i,s,o),l=r(a);n.set(l,e[o]=iu(l,a))}return{c(){t=bt("ul");for(let o=0;o<e.length;o+=1)e[o].c();dt(t,"class","list svelte-1ovnsax")},m(o,a){un(o,t,a);for(let l=0;l<e.length;l+=1)e[l]&&e[l].m(t,null)},p(o,a){a[0]&12289&&(s=Zr(o[12]),e=xh(e,a,r,1,o,s,n,t,_h,iu,null,tu))},d(o){o&&Ze(t);for(let a=0;a<e.length;a+=1)e[a].d()}}}function Mx(i){let t;return{c(){t=bt("p"),t.textContent="暂无卡点",dt(t,"class","hint svelte-1ovnsax")},m(e,n){un(e,t,n)},p:An,d(e){e&&Ze(t)}}}function iu(i,t){let e,n,s,r,o=t[34].id+"",a,l,c=t[34].x.toFixed(1)+"",h,f,u=t[34].z.toFixed(1)+"",d,g,_=co(t[34].clearWidth)+"",m,p,M,x;function E(){return t[30](t[34])}return{key:i,first:null,c(){var A;e=bt("li"),n=bt("button"),s=bt("strong"),r=Nt("#"),a=Nt(o),l=Nt(" ("),h=Nt(c),f=Nt(", "),d=Nt(u),g=Nt(") 净宽 "),m=Nt(_),p=Jt(),dt(n,"class","svelte-1ovnsax"),ke(n,"sel",((A=t[13])==null?void 0:A.id)===t[34].id),dt(e,"class","svelte-1ovnsax"),this.first=e},m(A,b){un(A,e,b),$(e,n),$(n,s),$(s,r),$(s,a),$(n,l),$(n,h),$(n,f),$(n,d),$(n,g),$(n,m),$(e,p),M||(x=xe(n,"click",E),M=!0)},p(A,b){var S;t=A,b[0]&4096&&o!==(o=t[34].id+"")&&De(a,o),b[0]&4096&&c!==(c=t[34].x.toFixed(1)+"")&&De(h,c),b[0]&4096&&u!==(u=t[34].z.toFixed(1)+"")&&De(d,u),b[0]&4096&&_!==(_=co(t[34].clearWidth)+"")&&De(m,_),b[0]&12288&&ke(n,"sel",((S=t[13])==null?void 0:S.id)===t[34].id)},d(A){A&&Ze(e),M=!1,x()}}}function su(i){let t,e,n,s=i[13].id+"",r,o,a,l,c,h=i[13].x.toFixed(2)+"",f,u,d=i[13].z.toFixed(2)+"",g,_,m,p,M,x=co(i[13].clearWidth)+"",E,A,b,S,P=i[13].slope>0&&ru(i),T=Zr(i[13].reasons),v=[];for(let R=0;R<T.length;R+=1)v[R]=ou(Qc(i,T,R));return{c(){t=bt("div"),e=bt("h3"),n=Nt("卡点 #"),r=Nt(s),o=Nt(" 详情"),a=Jt(),l=bt("p"),c=Nt("位置：("),f=Nt(h),u=Nt(", "),g=Nt(d),_=Nt(")"),m=Jt(),p=bt("p"),M=Nt("有效净宽："),E=Nt(x),A=Jt(),P&&P.c(),b=Jt(),S=bt("ul");for(let R=0;R<v.length;R+=1)v[R].c();dt(e,"class","svelte-1ovnsax"),dt(l,"class","svelte-1ovnsax"),dt(p,"class","svelte-1ovnsax"),dt(S,"class","svelte-1ovnsax"),dt(t,"class","detail svelte-1ovnsax")},m(R,L){un(R,t,L),$(t,e),$(e,n),$(e,r),$(e,o),$(t,a),$(t,l),$(l,c),$(l,f),$(l,u),$(l,g),$(l,_),$(t,m),$(t,p),$(p,M),$(p,E),$(t,A),P&&P.m(t,null),$(t,b),$(t,S);for(let D=0;D<v.length;D+=1)v[D]&&v[D].m(S,null)},p(R,L){if(L[0]&8192&&s!==(s=R[13].id+"")&&De(r,s),L[0]&8192&&h!==(h=R[13].x.toFixed(2)+"")&&De(f,h),L[0]&8192&&d!==(d=R[13].z.toFixed(2)+"")&&De(g,d),L[0]&8192&&x!==(x=co(R[13].clearWidth)+"")&&De(E,x),R[13].slope>0?P?P.p(R,L):(P=ru(R),P.c(),P.m(t,b)):P&&(P.d(1),P=null),L[0]&8192){T=Zr(R[13].reasons);let D;for(D=0;D<T.length;D+=1){const N=Qc(R,T,D);v[D]?v[D].p(N,L):(v[D]=ou(N),v[D].c(),v[D].m(S,null))}for(;D<v.length;D+=1)v[D].d(1);v.length=T.length}},d(R){R&&Ze(t),P&&P.d(),ah(v,R)}}}function ru(i){let t,e,n=(i[13].slope*100).toFixed(1)+"",s,r;return{c(){t=bt("p"),e=Nt("最大坡度："),s=Nt(n),r=Nt("%"),dt(t,"class","svelte-1ovnsax")},m(o,a){un(o,t,a),$(t,e),$(t,s),$(t,r)},p(o,a){a[0]&8192&&n!==(n=(o[13].slope*100).toFixed(1)+"")&&De(s,n)},d(o){o&&Ze(t)}}}function ou(i){let t,e=i[31]+"",n;return{c(){t=bt("li"),n=Nt(e)},m(s,r){un(s,t,r),$(t,n)},p(s,r){r[0]&8192&&e!==(e=s[31]+"")&&De(n,e)},d(s){s&&Ze(t)}}}function Sx(i){let t,e,n,s,r,o,a,l,c,h,f,u,d,g,_,m,p,M,x,E,A,b,S,P,T,v,R,L,D,N,z,O,Y,B,it,st,ht,Pt,Wt,K,et,pt,lt,Ot,Rt,Xt,F,qt,zt,Qt,_t,Ht,Bt,wt,$t,U,w,X,Z,tt,J,vt,ot,at,Ut,nt,mt,kt,Et,ct,It,Tt,re,y=i[11].colliders+"",q,G,j=i[11].fps+"",Q,Mt,St,te,ce,Yt=i[12].length+"",le,ue,we,Te,Qe,Mn,he=i[8]!=="free"&&eu(i),be=i[11].pathLen&&nu(i);function fi(Ft,ie){return Ft[12].length===0?Mx:vx}let di=fi(i),Xe=di(i),Re=i[13]&&su(i);return{c(){t=bt("aside"),e=bt("h1"),e.textContent="无障碍通行仿真",n=Jt(),s=bt("section"),r=bt("h2"),r.textContent="轮椅参数",o=Jt(),a=bt("label"),l=Nt("宽度 (m)"),c=bt("input"),h=Jt(),f=bt("label"),u=Nt("长度 (m)"),d=bt("input"),g=Jt(),_=bt("label"),m=Nt("最小转弯半径 (m)"),p=bt("input"),M=Jt(),x=bt("label"),E=Nt("净宽阈值 (m)"),A=bt("input"),b=Jt(),S=bt("section"),P=bt("h2"),P.textContent="平面与路径",T=Jt(),v=bt("div"),R=bt("button"),R.textContent="载入平面/结果文件",L=Jt(),D=bt("input"),N=Jt(),z=bt("div"),O=bt("button"),Y=Nt("设置起点"),it=Jt(),st=bt("button"),ht=Nt("设置终点"),Wt=Jt(),K=bt("div"),et=bt("button"),pt=Nt("重新求解"),Ot=Jt(),Rt=bt("button"),Xt=Nt("导出结果"),qt=Jt(),zt=bt("p"),zt.textContent="提示：橙色方块为门宽拖柄，蓝色方块为坡道长度拖柄；拖动后自动重新求解。",Qt=Jt(),_t=bt("section"),Ht=bt("h2"),Ht.textContent="视角漫游",Bt=Jt(),wt=bt("div"),$t=bt("button"),$t.textContent="自由视角",U=Jt(),w=bt("button"),X=Nt("俯视漫游"),tt=Jt(),J=bt("button"),vt=Nt("第一人称"),at=Jt(),he&&he.c(),Ut=Jt(),nt=bt("section"),mt=bt("h2"),mt.textContent="状态",kt=Jt(),Et=bt("p"),ct=Nt(i[10]),It=Jt(),Tt=bt("p"),re=Nt("碰撞体："),q=Nt(y),G=Nt(" 个 · FPS："),Q=Nt(j),be&&be.c(),Mt=Jt(),St=bt("section"),te=bt("h2"),ce=Nt("卡点清单（"),le=Nt(Yt),ue=Nt("）"),we=Jt(),Xe.c(),Te=Jt(),Re&&Re.c(),dt(e,"class","svelte-1ovnsax"),dt(r,"class","svelte-1ovnsax"),dt(c,"type","number"),dt(c,"step","0.01"),dt(c,"min","0.5"),dt(c,"max","1"),dt(c,"class","svelte-1ovnsax"),dt(a,"class","svelte-1ovnsax"),dt(d,"type","number"),dt(d,"step","0.05"),dt(d,"min","0.8"),dt(d,"max","1.6"),dt(d,"class","svelte-1ovnsax"),dt(f,"class","svelte-1ovnsax"),dt(p,"type","number"),dt(p,"step","0.1"),dt(p,"min","0.3"),dt(p,"max","3"),dt(p,"class","svelte-1ovnsax"),dt(_,"class","svelte-1ovnsax"),dt(A,"type","number"),dt(A,"step","0.05"),dt(A,"min","0.6"),dt(A,"max","1.5"),dt(A,"class","svelte-1ovnsax"),dt(x,"class","svelte-1ovnsax"),dt(s,"class","svelte-1ovnsax"),dt(P,"class","svelte-1ovnsax"),dt(R,"class","svelte-1ovnsax"),dt(D,"type","file"),dt(D,"accept",".json,application/json"),D.hidden=!0,dt(v,"class","row svelte-1ovnsax"),O.disabled=B=!i[4],dt(O,"class","svelte-1ovnsax"),ke(O,"active",i[3]==="start"),st.disabled=Pt=!i[4],dt(st,"class","svelte-1ovnsax"),ke(st,"active",i[3]==="end"),dt(z,"class","row svelte-1ovnsax"),et.disabled=lt=!i[5]||!i[6],dt(et,"class","svelte-1ovnsax"),Rt.disabled=F=!i[7],dt(Rt,"class","svelte-1ovnsax"),dt(K,"class","row svelte-1ovnsax"),dt(zt,"class","hint svelte-1ovnsax"),dt(S,"class","svelte-1ovnsax"),dt(Ht,"class","svelte-1ovnsax"),dt($t,"class","svelte-1ovnsax"),ke($t,"active",i[8]==="free"),w.disabled=Z=!i[7],dt(w,"class","svelte-1ovnsax"),ke(w,"active",i[8]==="top"),J.disabled=ot=!i[7],dt(J,"class","svelte-1ovnsax"),ke(J,"active",i[8]==="fps"),dt(wt,"class","row svelte-1ovnsax"),dt(_t,"class","svelte-1ovnsax"),dt(mt,"class","svelte-1ovnsax"),dt(Et,"class","status svelte-1ovnsax"),dt(Tt,"class","meta svelte-1ovnsax"),dt(nt,"class","svelte-1ovnsax"),dt(te,"class","svelte-1ovnsax"),dt(St,"class","grow svelte-1ovnsax"),dt(t,"class","panel svelte-1ovnsax")},m(Ft,ie){un(Ft,t,ie),$(t,e),$(t,n),$(t,s),$(s,r),$(s,o),$(s,a),$(a,l),$(a,c),Wn(c,i[2].width),$(s,h),$(s,f),$(f,u),$(f,d),Wn(d,i[2].length),$(s,g),$(s,_),$(_,m),$(_,p),Wn(p,i[2].turnRadius),$(s,M),$(s,x),$(x,E),$(x,A),Wn(A,i[2].threshold),$(t,b),$(t,S),$(S,P),$(S,T),$(S,v),$(v,R),$(v,L),$(v,D),i[22](D),$(S,N),$(S,z),$(z,O),$(O,Y),$(z,it),$(z,st),$(st,ht),$(S,Wt),$(S,K),$(K,et),$(et,pt),$(K,Ot),$(K,Rt),$(Rt,Xt),$(S,qt),$(S,zt),$(t,Qt),$(t,_t),$(_t,Ht),$(_t,Bt),$(_t,wt),$(wt,$t),$(wt,U),$(wt,w),$(w,X),$(wt,tt),$(wt,J),$(J,vt),$(_t,at),he&&he.m(_t,null),$(t,Ut),$(t,nt),$(nt,mt),$(nt,kt),$(nt,Et),$(Et,ct),$(nt,It),$(nt,Tt),$(Tt,re),$(Tt,q),$(Tt,G),$(Tt,Q),be&&be.m(Tt,null),$(t,Mt),$(t,St),$(St,te),$(te,ce),$(te,le),$(te,ue),$(St,we),Xe.m(St,null),$(St,Te),Re&&Re.m(St,null),Qe||(Mn=[xe(c,"input",i[17]),xe(c,"change",i[14]),xe(d,"input",i[18]),xe(d,"change",i[14]),xe(p,"input",i[19]),xe(p,"change",i[14]),xe(A,"input",i[20]),xe(A,"change",i[14]),xe(R,"click",i[21]),xe(D,"change",i[15]),xe(O,"click",i[23]),xe(st,"click",i[24]),xe(et,"click",i[25]),xe(Rt,"click",i[16]),xe($t,"click",i[26]),xe(w,"click",i[27]),xe(J,"click",i[28])],Qe=!0)},p(Ft,ie){ie[0]&4&&ei(c.value)!==Ft[2].width&&Wn(c,Ft[2].width),ie[0]&4&&ei(d.value)!==Ft[2].length&&Wn(d,Ft[2].length),ie[0]&4&&ei(p.value)!==Ft[2].turnRadius&&Wn(p,Ft[2].turnRadius),ie[0]&4&&ei(A.value)!==Ft[2].threshold&&Wn(A,Ft[2].threshold),ie[0]&16&&B!==(B=!Ft[4])&&(O.disabled=B),ie[0]&8&&ke(O,"active",Ft[3]==="start"),ie[0]&16&&Pt!==(Pt=!Ft[4])&&(st.disabled=Pt),ie[0]&8&&ke(st,"active",Ft[3]==="end"),ie[0]&96&&lt!==(lt=!Ft[5]||!Ft[6])&&(et.disabled=lt),ie[0]&128&&F!==(F=!Ft[7])&&(Rt.disabled=F),ie[0]&256&&ke($t,"active",Ft[8]==="free"),ie[0]&128&&Z!==(Z=!Ft[7])&&(w.disabled=Z),ie[0]&256&&ke(w,"active",Ft[8]==="top"),ie[0]&128&&ot!==(ot=!Ft[7])&&(J.disabled=ot),ie[0]&256&&ke(J,"active",Ft[8]==="fps"),Ft[8]!=="free"?he?he.p(Ft,ie):(he=eu(Ft),he.c(),he.m(_t,null)):he&&(he.d(1),he=null),ie[0]&1024&&De(ct,Ft[10]),ie[0]&2048&&y!==(y=Ft[11].colliders+"")&&De(q,y),ie[0]&2048&&j!==(j=Ft[11].fps+"")&&De(Q,j),Ft[11].pathLen?be?be.p(Ft,ie):(be=nu(Ft),be.c(),be.m(Tt,null)):be&&(be.d(1),be=null),ie[0]&4096&&Yt!==(Yt=Ft[12].length+"")&&De(le,Yt),di===(di=fi(Ft))&&Xe?Xe.p(Ft,ie):(Xe.d(1),Xe=di(Ft),Xe&&(Xe.c(),Xe.m(St,Te))),Ft[13]?Re?Re.p(Ft,ie):(Re=su(Ft),Re.c(),Re.m(St,null)):Re&&(Re.d(1),Re=null)},i:An,o:An,d(Ft){Ft&&Ze(t),i[22](null),he&&he.d(),be&&be.d(),Xe.d(),Re&&Re.d(),Qe=!1,Li(Mn)}}}function co(i){return i===1/0?"—":i.toFixed(2)+" m"}function yx(i,t,e){let n,s,r,o,a,l,c,h,f,u,d,g;Ke(i,Tn,B=>e(2,n=B)),Ke(i,js,B=>e(3,s=B)),Ke(i,jr,B=>e(4,r=B)),Ke(i,Gs,B=>e(5,o=B)),Ke(i,Vs,B=>e(6,a=B)),Ke(i,Kr,B=>e(7,l=B)),Ke(i,Yr,B=>e(8,c=B)),Ke(i,Ys,B=>e(9,h=B)),Ke(i,gn,B=>e(10,f=B)),Ke(i,Hs,B=>e(11,u=B)),Ke(i,yi,B=>e(12,d=B)),Ke(i,qr,B=>e(13,g=B));let{sim:_}=t,m;function p(){_.updateParams(n)}function M(B){var ht;const it=(ht=B.target.files)==null?void 0:ht[0];if(!it)return;const st=new FileReader;st.onload=()=>{try{const Pt=JSON.parse(st.result);let Wt;Pt.version===1&&Pt.plan?Wt=_.importData(Pt):Pt.walls?Wt=_.importPlanOnly(Pt):Wt="无法识别的文件格式",gn.set(Wt||`已载入文件：${it.name}`)}catch(Pt){gn.set("文件解析失败："+Pt.message)}},st.readAsText(it),B.target.value=""}function x(){const B=_.exportData(),it=new Blob([JSON.stringify(B,null,2)],{type:"application/json"}),st=document.createElement("a");st.href=URL.createObjectURL(it),st.download="accessible-route.json",st.click(),URL.revokeObjectURL(st.href),gn.set("已导出路径与卡点清单（含平面、参数，可再次载入）")}function E(){n.width=ei(this.value),Tn.set(n)}function A(){n.length=ei(this.value),Tn.set(n)}function b(){n.turnRadius=ei(this.value),Tn.set(n)}function S(){n.threshold=ei(this.value),Tn.set(n)}const P=()=>m.click();function T(B){$r[B?"unshift":"push"](()=>{m=B,e(1,m)})}const v=()=>_.setPickMode("start"),R=()=>_.setPickMode("end"),L=()=>_.solve(),D=()=>_.setViewMode("free"),N=()=>_.setViewMode("top"),z=()=>_.setViewMode("fps"),O=()=>Ys.update(B=>!B),Y=B=>_.focusBlockage(B);return i.$$set=B=>{"sim"in B&&e(0,_=B.sim)},[_,m,n,s,r,o,a,l,c,h,f,u,d,g,p,M,x,E,A,b,S,P,T,v,R,L,D,N,z,O,Y]}class Ex extends gu{constructor(t){super(),mu(this,t,yx,Sx,za,{sim:0},null,[-1,-1])}}function au(i){let t,e;return t=new Ex({props:{sim:i[1]}}),{c(){vh(t.$$.fragment)},m(n,s){du(t,n,s),e=!0},p(n,s){const r={};s&2&&(r.sim=n[1]),t.$set(r)},i(n){e||(ps(t.$$.fragment,n),e=!0)},o(n){va(t.$$.fragment,n),e=!1},d(n){pu(t,n)}}}function Tx(i){let t,e,n,s,r=i[2]&&au(i);return{c(){t=bt("main"),e=bt("canvas"),n=Jt(),r&&r.c(),dt(e,"class","svelte-1xj13z7"),ke(e,"pick",i[3]!=="none"),dt(t,"class","svelte-1xj13z7")},m(o,a){un(o,t,a),$(t,e),i[4](e),$(t,n),r&&r.m(t,null),s=!0},p(o,[a]){(!s||a&8)&&ke(e,"pick",o[3]!=="none"),o[2]?r?(r.p(o,a),a&4&&ps(r,1)):(r=au(o),r.c(),ps(r,1),r.m(t,null)):r&&(mh(),va(r,1,1,()=>{r=null}),gh())},i(o){s||(ps(r),s=!0)},o(o){va(r),s=!1},d(o){o&&Ze(t),i[4](null),r&&r.d()}}}function bx(i,t,e){let n;Ke(i,js,l=>e(3,n=l));let s,r,o=!1;ch(()=>{e(1,r=new _x(s)),r.loadPlan(xx()),e(2,o=!0)}),uh(()=>r==null?void 0:r.dispose());function a(l){$r[l?"unshift":"push"](()=>{s=l,e(0,s)})}return[s,r,o,n,a]}class Ax extends gu{constructor(t){super(),mu(this,t,bx,Tx,za,{})}}new Ax({target:document.getElementById("app")});
