const backendPath = '../../../backend/routes/routes.php';
const usuario = JSON.parse(sessionStorage.getItem('usuario'));
if(!usuario){ 
    alert('Debe iniciar sesión'); 
    window.location.href='../../login.html'; 
}
document.getElementById('bienvenida').textContent = `Bienvenido, ${usuario.nombre}`;
const id_usuario = usuario.id_usuario;

function mostrarToast(mensaje, tipo = 'success', duracion = 3000) {
    const toast = document.createElement('div');
    toast.className = 'toast ' + tipo;
    toast.textContent = mensaje;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 100);

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => document.body.removeChild(toast), 300);
    }, duracion);
}

let callbackConfirm = null;

function mostrarConfirmacion(mensaje, callback){
    document.getElementById('mensajeConfirm').textContent = mensaje;
    document.getElementById('modalConfirm').classList.add('show'); 
    callbackConfirm = callback;
}

function cerrarConfirmModal(){ 
    document.getElementById('modalConfirm').classList.remove('show'); 
    callbackConfirm = null; 
}

document.getElementById('btnConfirmSi').addEventListener('click', ()=>{
    if(callbackConfirm) callbackConfirm();
    cerrarConfirmModal();
});

function generarBotonAccion(curso, inscritos, bajas){
    const hoy = new Date();
    const fechaFin = new Date(curso.fecha_fin);
    const numInscritos = parseInt(curso.inscritos) || 0;
    const numPlazas = parseInt(curso.plazas) || 0;

    if(bajas.includes(curso.id_curso)){
        return `<span class="mensaje-baja">Ya te has dado de baja</span>`;
    }
    if(curso.estado !== 'activo') {
        return `<span class="mensaje-baja">Curso inactivo</span>`;
    }
    if(fechaFin < hoy){
        return `<span class="mensaje-baja">Curso finalizado</span>`;
    }
    const estaInscrito = inscritos.includes(curso.id_curso);
    if (!estaInscrito && numInscritos >= numPlazas) {
        return `<span style="color:red; font-weight:bold; border:1px solid red; padding:5px; border-radius:5px;">COMPLETO</span>`;
    }
    return estaInscrito 
        ? `<button onclick="confirmarBaja(${curso.id_curso}, this)">Darse de baja</button>` 
        : `<button onclick="inscribirse(${curso.id_curso}, this)">Inscribirse</button>`;
}

async function cargarCursosAlumno(){
    try {
        const filtro = document.getElementById('buscarCursos').value;

        const res = await fetch(`${backendPath}?action=listar_cursos&filtro=${encodeURIComponent(filtro)}&estado=activo`);
        const cursos = await res.json();

        const insRes = await fetch(`${backendPath}?action=listar_inscripciones&id_usuario=${id_usuario}`);
        const inscripciones = await insRes.json();

        const inscritos = inscripciones.filter(i => i.estado === 'activo').map(i => i.id_curso);
        const bajas = inscripciones.filter(i => i.estado === 'baja').map(i => i.id_curso);

        const tbody = document.querySelector('#tablaCursosAlumno tbody');
        tbody.innerHTML = '';
        if(cursos.length === 0){
            tbody.innerHTML = '<tr><td colspan="6">No hay cursos disponibles</td></tr>';
        } else {
            cursos.forEach(c => {
                const botonAccion = generarBotonAccion(c, inscritos, bajas);
                
                let estadoVisual = c.estado;
                const hoy = new Date();
                const fechaFin = new Date(c.fecha_fin);
                
                if (fechaFin < hoy && c.estado === 'activo') {
                    estadoVisual = 'finalizado';
                }
                

                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${c.titulo}</td>
                    <td>${c.descripcion || ''}</td>
                    <td>${c.fecha_inicio || ''}</td>
                    <td>${c.fecha_fin || ''}</td>
                    <td>${estadoVisual}</td> <td>${botonAccion}</td>
                `;
                tbody.appendChild(tr);
            });
        }

        renderTarjetasCursosAlumno(cursos, inscritos, bajas);

    } catch(err) {
        console.error(err);
        mostrarToast('No se pudieron cargar los cursos.');
    }
}

async function inscribirse(idCurso, boton){
    try {
        boton.disabled = true;
        const formData = new FormData();
        formData.append('action','inscribirse');
        formData.append('id_usuario', id_usuario);
        formData.append('id_curso', idCurso);

        const res = await fetch(backendPath,{method:'POST', body:formData});
        const data = await res.json();
        mostrarToast(data.msg || (data.status==='ok' ? 'Inscripción realizada correctamente' : 'Error al inscribirse'));
        if(data.status==='ok') {
            cargarCursosAlumno();
            cargarHistorial();
        } else {
            boton.disabled = false;
        }
    } catch(err){
        console.error(err);
        mostrarToast('No se pudo realizar la inscripción.');
        boton.disabled = false;
    }
}

function confirmarBaja(idCurso, boton){
    mostrarConfirmacion('¿Desea darse de baja de este curso?', ()=>{
        darseBaja(idCurso, boton);
    });
}

async function darseBaja(idCurso, boton){
    try {
        boton.disabled = true;
        const formData = new FormData();
        formData.append('action','darse_baja');
        formData.append('id_usuario', id_usuario);
        formData.append('id_curso', idCurso);

        const res = await fetch(backendPath,{method:'POST', body:formData});
        const data = await res.json();
        mostrarToast(data.msg || (data.status==='ok' ? 'Baja registrada correctamente' : 'Error al darse de baja'));
        if(data.status==='ok') {
            cargarCursosAlumno();
            cargarHistorial();
        } else {
            boton.disabled = false;
        }
    } catch(err){
        console.error(err);
        mostrarToast('No se pudo dar de baja.');
        boton.disabled = false;
    }
}

async function cargarHistorial(){
    try {
        const filtro = document.getElementById('filtroEstadoHistorial').value;
        const res = await fetch(`${backendPath}?action=listar_inscripciones&id_usuario=${id_usuario}`);
        let historial = await res.json();
        if(filtro !== 'todos') historial = historial.filter(c => c.estado === filtro);

        const tbody = document.querySelector('#tablaHistorialAlumno tbody');
        tbody.innerHTML = '';
        if(historial.length === 0){
            tbody.innerHTML = '<tr><td colspan="5">No hay historial de cursos</td></tr>';
        } else {
            historial.forEach(c => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${c.titulo}</td>
                    <td>${c.descripcion || ''}</td>
                    <td>${c.fecha_inicio || ''}</td>
                    <td>${c.fecha_fin || ''}</td>
                    <td>${c.estado}</td>
                `;
                tbody.appendChild(tr);
            });
        }

        renderTarjetasHistorialAlumno(historial);
    } catch(err){
        console.error(err);
        mostrarToast('No se pudo cargar el historial.');
    }
}

function renderTarjetasCursosAlumno(cursos, inscritos, bajas){
    const container = document.getElementById('cardCursosAlumno');
    container.innerHTML='';
    cursos.forEach(c=>{
        const boton = generarBotonAccion(c, inscritos, bajas);
        
        let estadoVisual = c.estado;
        const hoy = new Date();
        const fechaFin = new Date(c.fecha_fin);
        
        if (fechaFin < hoy && c.estado === 'activo') {
            estadoVisual = 'finalizado';
        }
        
        const card = document.createElement('div');
        card.classList.add('card');
        card.innerHTML=`
            <h3>${c.titulo}</h3>
            <p>${c.descripcion}</p>
            <p>Inicio: ${c.fecha_inicio}</p>
            <p>Fin: ${c.fecha_fin}</p>
            <p>Estado: ${estadoVisual}</p> <div class="acciones-card">${boton}</div>
        `;
        container.appendChild(card);
    });
}

function renderTarjetasHistorialAlumno(historial){
    const container = document.getElementById('cardHistorialAlumno');
    container.innerHTML='';
    historial.forEach(c=>{
        const card = document.createElement('div');
        card.classList.add('card');
        card.innerHTML=`
            <h3>${c.titulo}</h3>
            <p>${c.descripcion}</p>
            <p>Inicio: ${c.fecha_inicio}</p>
            <p>Fin: ${c.fecha_fin}</p>
            <p>Estado: ${c.estado}</p>
        `;
        container.appendChild(card);
    });
}

function logout(){
    sessionStorage.removeItem('usuario');
    window.location.href='../../login.html';
}

cargarCursosAlumno();
cargarHistorial();
