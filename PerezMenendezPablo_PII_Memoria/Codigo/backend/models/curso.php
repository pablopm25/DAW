<?php
class Curso {
    private $pdo;

    public function __construct($pdo){
        $this->pdo = $pdo;
    }

    public function listarCursos($filtro = '', $estado = 'todos'){
    $sql = "SELECT c.*, 
            (SELECT COUNT(*) FROM inscripciones i WHERE i.id_curso = c.id_curso AND i.estado = 'activo') as inscritos
            FROM cursos c WHERE 1=1";
    
    $params = [];

    if($filtro !== ''){
        $sql .= " AND c.titulo LIKE ?";
        $params[] = "%$filtro%";
    }

    if($estado !== 'todos'){
        $sql .= " AND c.estado=?";
        $params[] = $estado;
    }

    $sql .= " ORDER BY c.fecha_inicio DESC";
    $stmt = $this->pdo->prepare($sql);
    $stmt->execute($params);
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

    public function obtenerCurso($id){
        $stmt = $this->pdo->prepare("SELECT * FROM cursos WHERE id_curso=?");
        $stmt->execute([$id]);
        return $stmt->fetch();
    }

    public function crearCurso($titulo, $descripcion, $fecha_inicio, $fecha_fin, $plazas){
        $stmt = $this->pdo->prepare(
            "INSERT INTO cursos (titulo, descripcion, fecha_inicio, fecha_fin, plazas, estado) 
             VALUES (?,?,?,?,?, 'activo')"
    );
             return $stmt->execute([$titulo, $descripcion, $fecha_inicio, $fecha_fin, $plazas]);
    }

    public function editarCurso($id, $titulo, $descripcion, $fecha_inicio, $fecha_fin, $plazas){
        $stmt = $this->pdo->prepare(
            "UPDATE cursos SET titulo=?, descripcion=?, fecha_inicio=?, fecha_fin=?, plazas=? WHERE id_curso=?"
    );
        return $stmt->execute([$titulo, $descripcion, $fecha_inicio, $fecha_fin, $plazas, $id]);
    }

    public function eliminarCurso($id){
        try {
            $this->pdo->beginTransaction();

            $stmt = $this->pdo->prepare("DELETE FROM inscripciones WHERE id_curso=?");
            $stmt->execute([$id]);

            $stmt = $this->pdo->prepare("DELETE FROM cursos WHERE id_curso=?");
            $res = $stmt->execute([$id]);

            $this->pdo->commit(); 
            return $res;

        } catch (Exception $e) {
            $this->pdo->rollBack();
            return false;
        }
    }

    public function cambiarEstado($id, $estado){
        $stmt = $this->pdo->prepare("UPDATE cursos SET estado=? WHERE id_curso=?"); 
        return $stmt->execute([$estado, $id]);
    }
}
?>
