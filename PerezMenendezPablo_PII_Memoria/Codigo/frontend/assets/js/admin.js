const backendPath = '../../../backend/routes/routes.php';
const usuario = JSON.parse(sessionStorage.getItem('usuario'));
if(!usuario){ alert('Debe iniciar sesión'); window.location.href='../../login.html'; }
document.getElementById('bienvenida').textContent = `Bienvenido, ${usuario.nombre}`;

function mostrarToast(mensaje, tipo='success', duracion=3000){
    const toast = document.createElement('div');
    toast.className = 'toast '+tipo;
    toast.textContent = mensaje;
    document.body.appendChild(toast);
    setTimeout(()=>toast.classList.add('show'),100);
    setTimeout(()=>{
        toast.classList.remove('show');
        setTimeout(()=>document.body.removeChild(toast),300);
    }, duracion);
}

let callbackConfirm = null;
function mostrarConfirmacion(mensaje, callback){
    document.getElementById('mensajeConfirm').textContent = mensaje;
    document.getElementById('modalConfirm').classList.add('show');
    callbackConfirm = callback;
}
document.getElementById('btnConfirmSi').addEventListener('click', ()=>{
    if(callbackConfirm) callbackConfirm();
    cerrarConfirmModal();
});
function cerrarConfirmModal(){ 
    document.getElementById('modalConfirm').classList.remove('show'); 
    callbackConfirm = null; 
}

function abrirModal(idCurso=null){
    const modal = document.getElementById('modalCurso');
    const form = document.getElementById('formCurso');
    modal.classList.add('show');

    if(idCurso){
        document.getElementById('modalTitulo').textContent = 'Editar Curso';
        fetch(`${backendPath}?action=obtener_curso&id_curso=${idCurso}`)
            .then(res=>res.json())
            .then(data=>{
                document.getElementById('cursoId').value = data.id_curso;
                document.getElementById('tituloCurso').value = data.titulo;
                document.getElementById('descripcionCurso').value = data.descripcion;
                document.getElementById('fechaInicioCurso').value = data.fecha_inicio;
                document.getElementById('fechaFinCurso').value = data.fecha_fin;
 
                if(document.getElementById('plazasCurso')) {
                    document.getElementById('plazasCurso').value = data.plazas;
                }
            })
            .catch(err=>console.error(err));
    } else {
        document.getElementById('modalTitulo').textContent = 'Nuevo Curso';
        form.reset();
        document.getElementById('cursoId').value = '';

        if(document.getElementById('plazasCurso')) {
            document.getElementById('plazasCurso').value = 20;
        }
    }
}
function cerrarModal(){ document.getElementById('modalCurso').classList.remove('show'); }

document.getElementById('formCurso').addEventListener('submit', async (e)=>{
    e.preventDefault();
    const formData = new FormData(e.target);
    const id = formData.get('cursoId');
    formData.set('action', id ? 'editar_curso' : 'crear_curso');

    try{
        const res = await fetch(backendPath, { method:'POST', body: formData });
        const data = await res.json();
        if(data.status==='ok'){
            mostrarToast(data.msg || 'Acción realizada con éxito', 'success');
            cerrarModal();
            cargarCursosAdmin();
        } else mostrarToast(data.msg || 'No se pudo guardar', 'error');
    } catch(err){ console.error(err); mostrarToast('Error de conexión', 'error'); }
});

async function cargarCursosAdmin(){
    const filtro = document.getElementById('buscarCursosAdmin').value;
    const estado = document.getElementById('filtroEstadoCurso').value;
    try{
        const res = await fetch(`${backendPath}?action=listar_cursos&filtro=${encodeURIComponent(filtro)}&estado=${encodeURIComponent(estado)}`);
        const cursos = await res.json();

        if(document.getElementById('totalCursos')){
            document.getElementById('totalCursos').textContent = cursos.length;
        }

        const tbody = document.querySelector('#tablaCursosAdmin tbody');
        tbody.innerHTML = '';
        cursos.forEach(c=>{
            let estadoVisual = c.estado;
            const hoy = new Date();
            const fechaFin = new Date(c.fecha_fin);
            
            if (fechaFin < hoy && c.estado === 'activo') {
                estadoVisual = 'finalizado';
            }
            
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${c.titulo}</td>
                <td>${c.descripcion}</td>
                <td>${c.fecha_inicio}</td>
                <td>${c.fecha_fin}</td>
                <td><strong>${c.inscritos} / ${c.plazas}</strong></td> 
                <td>${estadoVisual}</td> <td>
                    <button onclick="abrirModal(${c.id_curso})">Editar</button>
                    <button onclick="eliminarCurso(${c.id_curso})">Eliminar</button>
                    <button onclick="cambiarEstadoCurso(${c.id_curso}, '${c.estado==='activo'?'inactivo':'activo'}')">
                        ${c.estado==='activo'?'Desactivar':'Activar'}
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
        renderTarjetasCursosAdmin(cursos);
    } catch(err){ console.error(err); mostrarToast('No se pudieron cargar los cursos', 'error'); }
}

function eliminarCurso(idCurso){
    mostrarConfirmacion('¿Seguro que quieres eliminar este curso? Se borrarán también las inscripciones.', async ()=>{
        const formData = new FormData();
        formData.append('action','eliminar_curso');
        formData.append('id_curso', idCurso);
        const res = await fetch(backendPath,{method:'POST', body:formData});
        const data = await res.json();
        if(data.status==='ok'){ mostrarToast(data.msg || 'Curso eliminado','success'); cargarCursosAdmin(); }
        else mostrarToast('Error al eliminar curso','error');
    });
}
function cambiarEstadoCurso(idCurso,nuevoEstado){
    mostrarConfirmacion(`¿Deseas ${nuevoEstado==='activo'?'activar':'desactivar'} este curso?`, async ()=>{
        const formData = new FormData();
        formData.append('action','cambiar_estado_curso');
        formData.append('id_curso', idCurso);
        formData.append('estado', nuevoEstado);
        const res = await fetch(backendPath,{method:'POST', body:formData});
        const data = await res.json();
        if(data.status==='ok'){
            mostrarToast(data.msg || `Curso ${nuevoEstado==='activo'?'activado':'desactivado'}`,'success');
            cargarCursosAdmin();
        } else mostrarToast('Error al cambiar estado','error');
    });
}


async function cargarInscripcionesAdmin(){
    const filtro = document.getElementById('buscarInscripciones').value;
    const estado = document.getElementById('filtroEstadoAlumno').value;
    try{
        const res = await fetch(`${backendPath}?action=listar_inscripciones&filtro=${encodeURIComponent(filtro)}&estado=${encodeURIComponent(estado)}`);
        const inscripciones = await res.json();

        if(document.getElementById('totalInscripciones')){
            const activas = inscripciones.filter(i => i.estado === 'activo').length;
            document.getElementById('totalInscripciones').textContent = activas;
        }

        const tbody = document.querySelector('#tablaInscripcionesAdmin tbody');
        tbody.innerHTML = '';
        
        inscripciones.forEach(i => {
            let botonAccion = '';
            if (i.estado === 'activo') {
                botonAccion = `<button onclick="darBajaAlumno(${i.id_inscripcion})">Dar de baja</button>`;
            } else {
                botonAccion = `<span style="color: #e53935; font-weight: bold;">Dado de baja</span>`;
            }

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${i.nombre}</td>
                <td>${i.titulo}</td>
                <td>${i.estado}</td>
                <td>${botonAccion}</td>
            `;
            tbody.appendChild(tr);
        });

        renderTarjetasInscripcionesAdmin(inscripciones); 
    } catch(err){ console.error(err); mostrarToast('No se pudieron cargar las inscripciones','error'); }
}

function darBajaAlumno(idInscripcion){
    mostrarConfirmacion('¿Dar de baja al alumno?', async ()=>{
        const formData = new FormData();
        formData.append('action','darse_baja_admin');
        formData.append('id_inscripcion', idInscripcion);
        const res = await fetch(backendPath,{method:'POST', body:formData});
        const data = await res.json();
        if(data.status==='ok'){
            mostrarToast(data.msg || 'Alumno dado de baja','success');
            cargarInscripcionesAdmin();
        } else mostrarToast('Error al dar de baja','error');
    });
}

function renderTarjetasCursosAdmin(cursos){
    const container = document.getElementById('cardCursosAdmin');
    container.innerHTML = '';
    cursos.forEach(c=>{
        let estadoVisual = c.estado;
        const hoy = new Date();
        const fechaFin = new Date(c.fecha_fin);
        
        if (fechaFin < hoy && c.estado === 'activo') {
            estadoVisual = 'finalizado';
        }

        const card = document.createElement('div');
        card.classList.add('card');
        card.innerHTML = `
            <h3>${c.titulo}</h3>
            <p>${c.descripcion}</p>
            <p>Inicio: ${c.fecha_inicio}</p>
            <p>Fin: ${c.fecha_fin}</p>
            <p><strong>Aforo: ${c.inscritos} / ${c.plazas}</strong></p>
            <p>Estado: ${estadoVisual}</p> <div class="acciones-card">
                <button onclick="abrirModal(${c.id_curso})">Editar</button>
                <button onclick="eliminarCurso(${c.id_curso})">Eliminar</button>
                <button onclick="cambiarEstadoCurso(${c.id_curso}, '${c.estado==='activo'?'inactivo':'activo'}')">
                    ${c.estado==='activo'?'Desactivar':'Activar'}
                </button>
            </div>
        `;
        container.appendChild(card);
    });
}

function renderTarjetasInscripcionesAdmin(inscripciones){
    const container = document.getElementById('cardInscripcionesAdmin');
    container.innerHTML = '';
    
    inscripciones.forEach(i => {
        let botonAccion = '';
        if (i.estado === 'activo') {
            botonAccion = `<button onclick="darBajaAlumno(${i.id_inscripcion})">Dar de baja</button>`;
        } else {
            botonAccion = `<span style="color: #e53935; font-weight: bold;">Dado de baja</span>`;
        }

        const card = document.createElement('div');
        card.classList.add('card');
        card.innerHTML = `
            <h3>${i.nombre}</h3>
            <p>Curso: ${i.titulo}</p>
            <p>Estado: ${i.estado}</p>
            <div class="acciones-card">
                ${botonAccion}
            </div>
        `;
        container.appendChild(card);
    });
}

function logout(){
    sessionStorage.removeItem('usuario');
    window.location.href='../../login.html';
}

document.getElementById('btnNuevoCurso').addEventListener('click', ()=>abrirModal());
cargarCursosAdmin();
cargarInscripcionesAdmin();