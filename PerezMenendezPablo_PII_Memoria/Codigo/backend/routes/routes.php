<?php
ob_start();
header('Content-Type: application/json');
error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../models/usuario.php';
require_once __DIR__ . '/../models/curso.php';
require_once __DIR__ . '/../models/inscripcion.php';

session_start();

$usuarioModel = new Usuario($pdo);
$cursoModel = new Curso($pdo);
$inscripcionModel = new Inscripcion($pdo);


if (isset($_POST['action']) && $_POST['action'] === 'login') {
    $email = trim($_POST['email'] ?? '');
    $password = trim($_POST['password'] ?? '');

    if (!$email || !$password) {
        echo json_encode(['status' => 'error', 'msg' => 'Faltan datos']);
        exit();
    }

    $user = $usuarioModel->login($email, $password);

    if ($user) {
        $_SESSION['usuario'] = [
            'id_usuario' => $user['id_usuario'],
            'nombre' => $user['nombre'],
            'rol' => $user['rol'],
            'email' => $user['email']
        ];

        echo json_encode([
            'status' => 'ok',
            'id_usuario' => $user['id_usuario'],
            'nombre' => $user['nombre'],
            'rol' => $user['rol']
        ]);
    } else {
        echo json_encode(['status' => 'error', 'msg' => 'Usuario o contraseña incorrectos']);
    }
    exit();
}


if (isset($_POST['action']) && $_POST['action'] === 'registro') {
    $nombre = trim($_POST['nombre'] ?? '');
    $email = trim($_POST['email'] ?? '');
    $password = trim($_POST['password'] ?? '');

    if (!$nombre || !$email || !$password) {
        echo json_encode(['status' => 'error', 'msg' => 'Faltan datos']);
        exit();
    }

    if (substr($email, -10) !== '@gmail.com') {
        echo json_encode(['status' => 'error', 'msg' => 'Solo se permite el registro con cuentas @gmail.com']);
        exit();
    }

    $stmt = $pdo->prepare("SELECT 1 FROM usuarios WHERE email = ?");
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        echo json_encode(['status' => 'error', 'msg' => 'El correo ya está registrado']);
        exit();
    }

    $res = $usuarioModel->registrar($nombre, $email, $password, 'alumno');

    if ($res) {
        echo json_encode(['status' => 'ok', 'msg' => 'Usuario registrado correctamente']);
    } else {
        echo json_encode(['status' => 'error', 'msg' => 'Error al registrar en la base de datos']);
    }
    exit();
}


$rol = $_SESSION['usuario']['rol'] ?? 'invitado';

if (isset($_GET['action'])) {
    switch ($_GET['action']) {
        case 'listar_cursos':
            $filtro = $_GET['filtro'] ?? '';
            $estado = $_GET['estado'] ?? 'todos';
            if ($rol === 'alumno') $estado = 'activo';
            $cursos = $cursoModel->listarCursos($filtro, $estado);
            echo json_encode($cursos);
            exit();

        case 'obtener_curso':
            $id = $_GET['id_curso'] ?? 0;
            echo json_encode($cursoModel->obtenerCurso($id));
            exit();

        case 'listar_inscripciones':
    $filtro = $_GET['filtro'] ?? '';
    $estado = $_GET['estado'] ?? 'todos';
    
    if (isset($_GET['id_usuario'])) {
        $inscripciones = $inscripcionModel->listarInscripciones($_GET['id_usuario']);
    
    } else {
        if ($rol !== 'admin') {
            echo json_encode(['status' => 'error', 'msg' => 'Acceso denegado']);
            exit();
        }
        $inscripciones = $inscripcionModel->listarTodasInscripciones($filtro, $estado);
    }
    echo json_encode($inscripciones);
    exit();
    }
}


if (isset($_POST['action'])) {
    $accion = $_POST['action'];

    $acciones_admin = [
        'crear_curso',
        'editar_curso',
        'eliminar_curso',
        'cambiar_estado_curso',
        'darse_baja_admin'
    ];

    $acciones_logueados = [
        'inscribirse',
        'darse_baja'
    ];

    if ($rol === 'invitado' && (in_array($accion, $acciones_admin) || in_array($accion, $acciones_logueados))) {
        echo json_encode(['status' => 'error', 'msg' => 'Acceso denegado: Necesitas iniciar sesión']);
        exit();
    }

    if (in_array($accion, $acciones_admin) && $rol !== 'admin') {
        echo json_encode(['status' => 'error', 'msg' => 'Acceso denegado: Se requiere rol de administrador']);
        exit();
    }

    switch ($_POST['action']) {

        case 'crear_curso':
            $titulo = trim($_POST['tituloCurso'] ?? '');
            $descripcion = trim($_POST['descripcionCurso'] ?? '');
            $fecha_inicio = trim($_POST['fechaInicioCurso'] ?? '');
            $fecha_fin = trim($_POST['fechaFinCurso'] ?? '');
            $plazas = $_POST['plazas'] ?? 20; 

            if (!$titulo || !$descripcion || !$fecha_inicio || !$fecha_fin) {
                echo json_encode(['status' => 'error', 'msg' => 'Faltan datos']);
                exit();
            }
            if ($fecha_inicio > $fecha_fin) {
                echo json_encode(['status' => 'error', 'msg' => 'La fecha de inicio no puede ser mayor que la de fin']);
                exit();
            }
            $res = $cursoModel->crearCurso($titulo, $descripcion, $fecha_inicio, $fecha_fin, $plazas);
            
            echo json_encode(['status' => $res ? 'ok' : 'error', 'msg' => $res ? 'Curso creado correctamente' : 'Error al crear curso']);
            exit();

        case 'editar_curso':
            $id = $_POST['cursoId'] ?? null;
            $titulo = trim($_POST['tituloCurso'] ?? '');
            $descripcion = trim($_POST['descripcionCurso'] ?? '');
            $fecha_inicio = trim($_POST['fechaInicioCurso'] ?? '');
            $fecha_fin = trim($_POST['fechaFinCurso'] ?? '');
            $plazas = $_POST['plazas'] ?? 20; 

            if (!$id || !$titulo || !$descripcion || !$fecha_inicio || !$fecha_fin) {
                echo json_encode(['status' => 'error', 'msg' => 'Faltan datos']);
                exit();
            }
            if ($fecha_inicio > $fecha_fin) {
                echo json_encode(['status' => 'error', 'msg' => 'La fecha de inicio no puede ser mayor que la de fin']);
                exit();
            }
            $res = $cursoModel->editarCurso($id, $titulo, $descripcion, $fecha_inicio, $fecha_fin, $plazas);
            
            $cursoActualizado = $cursoModel->obtenerCurso($id);
            echo json_encode([
                'status' => $res ? 'ok' : 'error',
                'msg' => $res ? 'Curso actualizado correctamente' : 'Error al actualizar curso',
                'curso' => $cursoActualizado
            ]);
            exit();

        case 'eliminar_curso':
            $res = $cursoModel->eliminarCurso($_POST['id_curso']);
            echo json_encode(['status' => $res ? 'ok' : 'error', 'msg' => $res ? 'Curso eliminado' : 'Error al eliminar']);
            exit();

        case 'cambiar_estado_curso':
            $res = $cursoModel->cambiarEstado($_POST['id_curso'], $_POST['estado']);
            echo json_encode(['status' => $res ? 'ok' : 'error', 'msg' => $res ? 'Estado cambiado' : 'Error al cambiar estado']);
            exit();

        case 'inscribirse':
            $res = $inscripcionModel->inscribir($_POST['id_usuario'], $_POST['id_curso']);
            echo json_encode(['status' => $res ? 'ok' : 'error', 'msg' => $res ? 'Inscripción realizada' : 'Error']);
            exit();

        case 'darse_baja':
            $res = $inscripcionModel->darseBaja($_POST['id_usuario'], $_POST['id_curso']);
            echo json_encode(['status' => $res ? 'ok' : 'error', 'msg' => $res ? 'Baja realizada' : 'Error']);
            exit();

        case 'darse_baja_admin':
            $res = $inscripcionModel->darseBajaAdmin($_POST['id_inscripcion']);
            echo json_encode(['status' => $res ? 'ok' : 'error', 'msg' => $res ? 'Baja realizada' : 'Error']);
            exit();
    }
}
?>
