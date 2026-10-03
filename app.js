// CONFIGURACIÓN: usa la URL del proyecto y la Publishable/Anon key.
// NUNCA pongas aquí la service_role key.
const SUPABASE_URL="https://lgarvwwikqdfaeckxsay.supabase.co";
const SUPABASE_ANON_KEY="sb_publishable_XzeVcVs_vyOuwGPMY6gP6A_kvuEss2b";

const {createClient}=supabase;
const db=createClient(SUPABASE_URL,SUPABASE_ANON_KEY);

// ID del único usuario que puede administrar el calendario
const ADMIN_USER_ID="e2477dd4-cf99-4e14-b0cf-8fd6f3f4e5ad";

let month=new Date();
month.setDate(1);

let activities=[];

const $=id=>document.getElementById(id);

const months=[
  "enero","febrero","marzo","abril","mayo","junio",
  "julio","agosto","septiembre","octubre","noviembre","diciembre"
];

const weeks=["L","M","X","J","V","S","D"];


function key(d){
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}


function fmt(s){
  if(!s)return"";
  const [y,m,d]=s.split("-").map(Number);
  return new Intl.DateTimeFormat("es-ES",{
    day:"numeric",
    month:"long",
    year:"numeric"
  }).format(new Date(y,m-1,d));
}


function esc(v){
  return String(v??"").replace(
    /[&<>"']/g,
    m=>({
      "&":"&amp;",
      "<":"&lt;",
      ">":"&gt;",
      '"':"&quot;",
      "'":"&#039;"
    }[m])
  );
}


function cls(v){
  return (v||"other")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g,"")
    .replace(/\s+/g,"-");
}


// ============================================================
// CONTROL DEL BOTÓN ADMINISTRAR
// ============================================================

async function updateAdminButton(){
  try{
    const {data}=await db.auth.getUser();

    if(data.user && data.user.id===ADMIN_USER_ID){
      $("adminBtn").style.display="";
    }else{
      $("adminBtn").style.display="none";
    }

  }catch(error){
    console.error(error);
    $("adminBtn").style.display="none";
  }
}


// ============================================================
// CARGAR ACTIVIDADES
// ============================================================

async function load(){

  $("status").classList.remove("hidden");
  $("calendar").classList.add("hidden");
  $("empty").classList.add("hidden");

  const {
    data,
    error
  }=await db
    .from("ACTIVIDADES EXTRAESCOLARES")
    .select("*")
    .order("fecha",{ascending:true})
    .order("hora",{ascending:true});

  $("status").classList.add("hidden");

  if(error){

    $("error").textContent=
      "No se han podido cargar las actividades. Revisa la configuración de Supabase.";

    $("error").classList.remove("hidden");

    console.error(error);

    return;
  }

  activities=data||[];

  render();
}


// ============================================================
// DIBUJAR CALENDARIO
// ============================================================

function render(){

  $("month").textContent=
    `${months[month.getMonth()]} ${month.getFullYear()}`;

  $("calendar").innerHTML="";

  weeks.forEach(w=>{
    let e=document.createElement("div");
    e.className="weekday";
    e.textContent=w;
    $("calendar").appendChild(e);
  });

  const first=new Date(
    month.getFullYear(),
    month.getMonth(),
    1
  );

  const offset=(first.getDay()+6)%7;

  const total=new Date(
    month.getFullYear(),
    month.getMonth()+1,
    0
  ).getDate();

  const prev=new Date(
    month.getFullYear(),
    month.getMonth(),
    0
  ).getDate();


  for(let i=0;i<42;i++){

    let d;

    if(i<offset){

      d=new Date(
        month.getFullYear(),
        month.getMonth()-1,
        prev-offset+i+1
      );

    }else if(i>=offset+total){

      d=new Date(
        month.getFullYear(),
        month.getMonth()+1,
        i-offset-total+1
      );

    }else{

      d=new Date(
        month.getFullYear(),
        month.getMonth(),
        i-offset+1
      );

    }


    let cell=document.createElement("div");

    cell.className="day";

    if(d.getMonth()!==month.getMonth()){
      cell.classList.add("muted");
    }

    if(key(d)===key(new Date())){
      cell.classList.add("today");
    }


    let n=document.createElement("div");

    n.className="dayNum";
    n.textContent=d.getDate();

    cell.appendChild(n);


    activities
      .filter(a=>a.fecha===key(d))
      .forEach(a=>{

        let b=document.createElement("button");

        b.className=`event ${cls(a.tipo)}`;

        b.innerHTML=
          `<span class="eventTitle">${esc(a.titulo||"Sin título")}</span>`+
          `${a.hora?`<span class="eventTime">${esc(a.hora)}</span>`:""}`;

        b.onclick=()=>detail(a);

        cell.appendChild(b);

      });


    $("calendar").appendChild(cell);

  }


  $("calendar").classList.remove("hidden");


  const count=activities.filter(a=>{

    if(!a.fecha)return false;

    const [y,m]=a.fecha.split("-").map(Number);

    return y===month.getFullYear() &&
           m===month.getMonth()+1;

  }).length;


  if(!count){
    $("empty").classList.remove("hidden");
  }

}


// ============================================================
// DETALLE DE ACTIVIDAD
// ============================================================

function detail(a){

  $("activityContent").innerHTML=
    `<div class="eyebrow">${esc(a.tipo||"ACTIVIDAD")}</div>`+
    `<h2>${esc(a.titulo||"Sin título")}</h2>`+
    `<div class="detail"><dl>`+

    `<dt>Fecha</dt><dd>${esc(fmt(a.fecha))}</dd>`+

    `${a.hora?
      `<dt>Hora</dt><dd>${esc(a.hora)}</dd>`:""}`+

    `${a.grupos?
      `<dt>Grupos</dt><dd>${esc(a.grupos)}</dd>`:""}`+

    `${a.lugar?
      `<dt>Lugar</dt><dd>${esc(a.lugar)}</dd>`:""}`+

    `${a.responsable?
      `<dt>Responsable</dt><dd>${esc(a.responsable)}</dd>`:""}`+

    `${a.observaciones?
      `<dt>Observaciones</dt><dd>${esc(a.observaciones)}</dd>`:""}`+

    `</dl></div>`;

  $("activityDialog").showModal();
}


// ============================================================
// FORMULARIO
// ============================================================

function reset(){

  $("activityForm").reset();

  $("activityId").value="";

}


function fill(a){

  $("activityId").value=a.id;

  $("titulo").value=a.titulo||"";
  $("fecha").value=a.fecha||"";
  $("hora").value=a.hora||"";
  $("tipo").value=a.tipo||"";
  $("grupos").value=a.grupos||"";
  $("lugar").value=a.lugar||"";
  $("responsable").value=a.responsable||"";
  $("observaciones").value=a.observaciones||"";

  window.scrollTo({
    top:0,
    behavior:"smooth"
  });

}


// ============================================================
// GUARDAR / EDITAR
// ============================================================

async function save(e){

  e.preventDefault();


  const p={
    titulo:$("titulo").value.trim(),
    fecha:$("fecha").value,
    hora:$("hora").value.trim(),
    tipo:$("tipo").value,
    grupos:$("grupos").value.trim(),
    lugar:$("lugar").value.trim(),
    responsable:$("responsable").value.trim(),
    observaciones:$("observaciones").value.trim()
  };


  const id=$("activityId").value;


  const r=id
    ?await db
      .from("ACTIVIDADES EXTRAESCOLARES")
      .update(p)
      .eq("id",id)

    :await db
      .from("ACTIVIDADES EXTRAESCOLARES")
      .insert(p);


  if(r.error){

    $("formMessage").textContent=
      "No se ha podido guardar. Comprueba que tu cuenta es la administradora.";

    $("formMessage").classList.remove("hidden");

    console.error(r.error);

    return;
  }


  $("formMessage").textContent=
    id
      ?"Actividad actualizada."
      :"Actividad añadida.";

  $("formMessage").classList.remove("hidden");


  reset();

  await load();

  adminList();

}


// ============================================================
// LISTA DE ADMINISTRACIÓN
// ============================================================

function adminList(){

  const list=$("adminList");

  list.innerHTML="";


  activities.forEach(a=>{

    let r=document.createElement("div");

    r.className="adminRow";


    r.innerHTML=
      `<div>`+
        `<div class="adminTitle">${esc(a.titulo)}</div>`+
        `<div class="adminMeta">`+
          `${esc(fmt(a.fecha))}`+
          `${a.hora?" · "+esc(a.hora):""}`+
          `${a.grupos?" · "+esc(a.grupos):""}`+
        `</div>`+
      `</div>`+

      `<div class="rowActions">`+
        `<button class="smallBtn edit">Editar</button>`+
        `<button class="smallBtn danger del">Eliminar</button>`+
      `</div>`;


    r.querySelector(".edit").onclick=()=>fill(a);

    r.querySelector(".del").onclick=()=>del(a);


    list.appendChild(r);

  });

}


// ============================================================
// ELIMINAR
// ============================================================

async function del(a){

  if(!confirm(`¿Eliminar "${a.titulo}"?`)){
    return;
  }


  const {error}=await db
    .from("ACTIVIDADES EXTRAESCOLARES")
    .delete()
    .eq("id",a.id);


  if(error){

    alert("No se ha podido eliminar.");

    console.error(error);

    return;
  }


  await load();

  adminList();

}


// ============================================================
// ACCESO A ADMINISTRACIÓN
// ============================================================

async function admin(){

  const {data}=await db.auth.getUser();


  if(data.user && data.user.id===ADMIN_USER_ID){

    $("adminDialog").showModal();

    adminList();

  }else{

    $("adminDialog").close();

  }

}


// ============================================================
// LOGIN OCULTO
// ============================================================

function openAdminLogin(){

  $("loginError").classList.add("hidden");


  if(!$("loginDialog").open){

    $("loginDialog").showModal();

  }

}


// ============================================================
// RESTABLECIMIENTO DE CONTRASEÑA
// ============================================================
//
// Cuando Supabase abre una sesión mediante el enlace de
// recuperación, genera el evento PASSWORD_RECOVERY.
// En ese momento pedimos la nueva contraseña y la guardamos.
//
// Esto permite utilizar el enlace "Reset password" de Supabase
// sin necesidad de modificar el HTML.
//

db.auth.onAuthStateChange(async(event,session)=>{

  if(event==="PASSWORD_RECOVERY"){

    // Dejamos que Supabase termine de establecer la sesión
    // antes de intentar actualizar la contraseña.
    setTimeout(async()=>{

      let nuevaPassword=prompt(
        "Has accedido al restablecimiento de contraseña.\n\n"+
        "Escribe tu nueva contraseña:"
      );


      if(nuevaPassword===null){

        alert(
          "No se ha cambiado la contraseña.\n\n"+
          "Puedes volver a solicitar el restablecimiento cuando quieras."
        );

        await db.auth.signOut();

        await updateAdminButton();

        return;
      }


      nuevaPassword=nuevaPassword.trim();


      if(nuevaPassword.length<6){

        alert(
          "La contraseña debe tener al menos 6 caracteres.\n\n"+
          "Vuelve a solicitar el restablecimiento de contraseña."
        );

        await db.auth.signOut();

        await updateAdminButton();

        return;
      }


      const {error}=await db.auth.updateUser({
        password:nuevaPassword
      });


      if(error){

        alert(
          "No se ha podido cambiar la contraseña.\n\n"+
          "Vuelve a solicitar el correo de recuperación."
        );

        console.error(error);

        await db.auth.signOut();

        await updateAdminButton();

        return;
      }


      alert(
        "Contraseña actualizada correctamente.\n\n"+
        "Ahora podrás entrar en Administración utilizando tu correo y esta nueva contraseña."
      );


      await db.auth.signOut();

      await updateAdminButton();

    },0);

  }

});


// ============================================================
// EVENTOS DEL CALENDARIO
// ============================================================

$("prev").onclick=()=>{

  month.setMonth(month.getMonth()-1);

  render();

};


$("next").onclick=()=>{

  month.setMonth(month.getMonth()+1);

  render();

};


$("today").onclick=()=>{

  month=new Date();

  month.setDate(1);

  render();

};


$("adminBtn").onclick=admin;

$("activityForm").onsubmit=save;

$("clear").onclick=reset;


// ============================================================
// LOGIN
// ============================================================

$("loginForm").onsubmit=async e=>{

  e.preventDefault();


  const {data,error}=await db.auth.signInWithPassword({

    email:$("email").value.trim(),

    password:$("password").value

  });


  if(error){

    $("loginError").textContent=
      "Correo o contraseña incorrectos.";

    $("loginError").classList.remove("hidden");

    return;

  }


  if(data.user && data.user.id===ADMIN_USER_ID){

    $("loginDialog").close();

    $("adminDialog").showModal();

    adminList();

    updateAdminButton();

  }else{

    await db.auth.signOut();

    $("loginDialog").close();

    alert(
      "Esta cuenta no tiene permisos de administración."
    );

    updateAdminButton();

  }

};


// ============================================================
// CERRAR SESIÓN
// ============================================================

$("logout").onclick=async()=>{

  await db.auth.signOut();

  $("adminDialog").close();

  updateAdminButton();

};


// ============================================================
// CERRAR DIÁLOGOS
// ============================================================

document
  .querySelectorAll("[data-close]")
  .forEach(b=>{

    b.onclick=()=>$(b.dataset.close).close();

  });


// ============================================================
// ACCESO OCULTO A ADMINISTRACIÓN
// ============================================================
//
// Los visitantes no ven ningún botón de administración.
// Para acceder al login hay que pulsar Ctrl + Alt + A.
//

document.addEventListener("keydown",e=>{

  if(
    e.ctrlKey &&
    e.altKey &&
    e.key.toLowerCase()==="a"
  ){

    e.preventDefault();

    openAdminLogin();

  }

});


// ============================================================
// INICIO
// ============================================================

load();

updateAdminButton();
