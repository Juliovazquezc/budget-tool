import { useState, useEffect } from "react";

interface Material {
  id: number;
  name: string;
  price: number;
  quantity: number;
  isSelected: boolean;
}

// Función para cargar datos del localStorage
const loadMaterialsFromStorage = (): Material[] => {
  try {
    const savedMaterials = localStorage.getItem("budgetMaterials");
    if (savedMaterials) {
      return JSON.parse(savedMaterials);
    }
  } catch (error) {
    console.error("Error loading materials from localStorage:", error);
  }

  // Datos por defecto si no hay nada guardado
  return [];
};

// Función para guardar datos en localStorage
const saveMaterialsToStorage = (materials: Material[]) => {
  try {
    localStorage.setItem("budgetMaterials", JSON.stringify(materials));
  } catch (error) {
    console.error("Error saving materials to localStorage:", error);
  }
};

function App() {
  const [materials, setMaterials] = useState<Material[]>(() =>
    loadMaterialsFromStorage()
  );
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const [newMaterial, setNewMaterial] = useState({
    name: "",
    price: 0,
  });

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    price: 0,
  });

  // Guardar en localStorage cada vez que cambie materials
  useEffect(() => {
    if (materials.length > 0) {
      // Solo guardar si hay materiales
      saveMaterialsToStorage(materials);
      setLastSaved(new Date());
    }
  }, [materials]);

  // Cargar la fecha del último guardado al iniciar
  useEffect(() => {
    const savedDate = localStorage.getItem("budgetLastSaved");
    if (savedDate) {
      setLastSaved(new Date(savedDate));
    }
  }, []);

  // Guardar la fecha del último guardado
  useEffect(() => {
    if (lastSaved) {
      localStorage.setItem("budgetLastSaved", lastSaved.toISOString());
    }
  }, [lastSaved]);

  // Actualizar el display del tiempo cada minuto
  useEffect(() => {
    const interval = setInterval(() => {
      // Forzar re-render para actualizar el tiempo mostrado
      setLastSaved((prev) => (prev ? new Date(prev) : null));
    }, 60000); // 60 segundos

    return () => clearInterval(interval);
  }, []);

  const handleCheckboxChange = (id: number) => {
    setMaterials(
      materials.map((material) =>
        material.id === id
          ? { ...material, isSelected: !material.isSelected }
          : material
      )
    );
  };

  const handleQuantityChange = (id: number, quantity: number) => {
    if (quantity < 1) return;
    setMaterials(
      materials.map((material) =>
        material.id === id ? { ...material, quantity } : material
      )
    );
  };

  const addMaterial = () => {
    if (newMaterial.name.trim() && newMaterial.price > 0) {
      const newId = Math.max(...materials.map((m) => m.id), 0) + 1;
      setMaterials([
        ...materials,
        {
          id: newId,
          name: newMaterial.name.trim(),
          price: newMaterial.price,
          quantity: 1,
          isSelected: true, // Nuevo material se selecciona automáticamente
        },
      ]);
      setNewMaterial({ name: "", price: 0 });
      setShowAddForm(false);
    }
  };

  const removeMaterial = (id: number) => {
    setMaterials(materials.filter((material) => material.id !== id));
  };

  // Funciones para editar materiales
  const startEditMaterial = (material: Material) => {
    setEditingMaterial(material);
    setEditForm({
      name: material.name,
      price: material.price,
    });
  };

  const cancelEditMaterial = () => {
    setEditingMaterial(null);
    setEditForm({ name: "", price: 0 });
  };

  const saveEditMaterial = () => {
    if (editingMaterial && editForm.name.trim() && editForm.price > 0) {
      setMaterials(
        materials.map((material) =>
          material.id === editingMaterial.id
            ? {
                ...material,
                name: editForm.name.trim(),
                price: editForm.price,
              }
            : material
        )
      );
      cancelEditMaterial();
    }
  };

  // Función para manejar Enter en el formulario de agregar
  const handleAddFormKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && newMaterial.name.trim() && newMaterial.price > 0) {
      e.preventDefault();
      addMaterial();
    }
  };

  // Función para manejar Enter en el formulario de editar
  const handleEditFormKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && editForm.name.trim() && editForm.price > 0) {
      e.preventDefault();
      saveEditMaterial();
    }
  };

  // Funciones para verificar si los formularios están completos
  const isAddFormValid = () => {
    return newMaterial.name.trim() && newMaterial.price > 0;
  };

  const isEditFormValid = () => {
    return editForm.name.trim() && editForm.price > 0;
  };

  const calculateTotal = () => {
    return materials
      .filter((material) => material.isSelected)
      .reduce(
        (total, material) => total + material.price * material.quantity,
        0
      );
  };

  const formatPrice = (price: number) => {
    // Formatear el número con comas para separadores de miles
    const formattedNumber = price.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return `$${formattedNumber}`;
  };

  // Función para limpiar todo el presupuesto
  const clearBudget = () => {
    if (
      confirm(
        "¿Estás seguro de que quieres limpiar todo el presupuesto? Esta acción no se puede deshacer."
      )
    ) {
      setMaterials([]);
      setLastSaved(null);
      localStorage.removeItem("budgetMaterials");
      localStorage.removeItem("budgetLastSaved");
    }
  };

  // Función para exportar presupuesto
  const exportBudget = () => {
    const exportData = {
      materials,
      exportDate: new Date().toISOString(),
      totalBudget: calculateTotal(),
      selectedMaterials: materials.filter((m) => m.isSelected).length,
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri =
      "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);

    const exportFileDefaultName = `presupuesto_${
      new Date().toISOString().split("T")[0]
    }.json`;

    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();
  };

  // Función para formatear la fecha del último guardado
  const formatLastSaved = () => {
    if (!lastSaved) return "Sin guardar";

    const now = new Date();
    const diffMs = now.getTime() - lastSaved.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Guardado hace unos segundos";
    if (diffMins === 1) return "Guardado hace 1 minuto";
    if (diffMins < 60) return `Guardado hace ${diffMins} minutos`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours === 1) return "Guardado hace 1 hora";
    if (diffHours < 24) return `Guardado hace ${diffHours} horas`;

    return `Guardado el ${lastSaved.toLocaleDateString()}`;
  };

  return (
    <div className="app">
      {/* Header */}
      <div className="header">
        <div className="header-content">
          <div className="header-left">
            <div className="logo-title-container">
              <img src="/mabe.png" alt="Mabe Logo" className="company-logo" />
              <div>
                <h1 className="header-title">💰 Presupuesto de Materiales</h1>
              </div>
            </div>
          </div>
          <div className="total-section">
            <p className="total-label">Total del Presupuesto</p>
            <p className="total-amount">{formatPrice(calculateTotal())}</p>
            <p className="total-count">
              {materials.filter((m) => m.isSelected).length} materiales
              seleccionados
            </p>
          </div>
        </div>
      </div>

      {/* Add Material Button */}
      <div className="add-button">
        <div className="buttons-container">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="btn-add"
          >
            <span>+</span>
            Agregar Material
          </button>

          <button onClick={exportBudget} className="btn-export">
            📥 Exportar
          </button>

          <button onClick={clearBudget} className="btn-danger">
            🗑️ Limpiar Todo
          </button>

          <div className="storage-status">💾 {formatLastSaved()}</div>
        </div>
      </div>

      {/* Add Material Form */}
      {showAddForm && (
        <div className="add-form">
          <h3 className="form-title">🔨 Agregar Nuevo Material</h3>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Nombre del Material</label>
              <input
                type="text"
                value={newMaterial.name}
                onChange={(e) =>
                  setNewMaterial({ ...newMaterial, name: e.target.value })
                }
                onKeyDown={handleAddFormKeyDown}
                className="form-input"
                placeholder="Ej: Ladrillos"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Precio por Unidad</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={newMaterial.price}
                onChange={(e) =>
                  setNewMaterial({
                    ...newMaterial,
                    price: parseFloat(e.target.value) || 0,
                  })
                }
                onKeyDown={handleAddFormKeyDown}
                className="form-input"
                placeholder="0.00"
              />
            </div>
            <div className="form-buttons">
              <button
                onClick={addMaterial}
                className={`btn-primary ${
                  isAddFormValid() ? "form-ready" : ""
                }`}
                disabled={!isAddFormValid()}
                title={
                  isAddFormValid()
                    ? "Presiona Enter o haz clic para agregar"
                    : "Completa todos los campos"
                }
              >
                Agregar {isAddFormValid() && "⏎"}
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="btn-secondary"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Material Form */}
      {editingMaterial && (
        <div className="edit-form">
          <h3 className="form-title">✏️ Editar Material</h3>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Nombre del Material</label>
              <input
                type="text"
                value={editForm.name}
                onChange={(e) =>
                  setEditForm({ ...editForm, name: e.target.value })
                }
                onKeyDown={handleEditFormKeyDown}
                className="form-input"
                placeholder="Ej: Ladrillos"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Precio por Unidad</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={editForm.price}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    price: parseFloat(e.target.value) || 0,
                  })
                }
                onKeyDown={handleEditFormKeyDown}
                className="form-input"
                placeholder="0.00"
              />
            </div>
            <div className="form-buttons">
              <button
                onClick={saveEditMaterial}
                className={`btn-primary ${
                  isEditFormValid() ? "form-ready" : ""
                }`}
                disabled={!isEditFormValid()}
                title={
                  isEditFormValid()
                    ? "Presiona Enter o haz clic para guardar"
                    : "Completa todos los campos"
                }
              >
                Guardar {isEditFormValid() && "⏎"}
              </button>
              <button onClick={cancelEditMaterial} className="btn-secondary">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Materials List */}
      <div className="materials-container">
        <div className="materials-header">
          <h2 className="materials-title">📋 Lista de Materiales</h2>
        </div>

        <div>
          {materials.map((material) => (
            <div
              key={material.id}
              className={`material-item ${
                material.isSelected ? "selected" : ""
              }`}
            >
              <div className="material-content">
                {/* Left side: Checkbox and Material info */}
                <div className="material-info">
                  <input
                    type="checkbox"
                    checked={material.isSelected}
                    onChange={() => handleCheckboxChange(material.id)}
                    className="material-checkbox"
                  />
                  <div className="material-details">
                    <h3>{material.name}</h3>
                    <p className="material-price">
                      {formatPrice(material.price)} por unidad
                    </p>
                  </div>
                </div>

                {/* Right side: Controls */}
                <div className="material-controls">
                  {/* Quantity controls */}
                  <div className="quantity-control">
                    <span className="quantity-label">Cantidad:</span>
                    <div className="quantity-input-group">
                      <button
                        onClick={() =>
                          handleQuantityChange(
                            material.id,
                            material.quantity - 1
                          )
                        }
                        disabled={
                          !material.isSelected || material.quantity <= 1
                        }
                        className="quantity-btn"
                      >
                        −
                      </button>
                      <input
                        type="number"
                        value={material.quantity}
                        onChange={(e) =>
                          handleQuantityChange(
                            material.id,
                            parseInt(e.target.value) || 1
                          )
                        }
                        disabled={!material.isSelected}
                        className="quantity-input"
                        min="1"
                      />
                      <button
                        onClick={() =>
                          handleQuantityChange(
                            material.id,
                            material.quantity + 1
                          )
                        }
                        disabled={!material.isSelected}
                        className="quantity-btn"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Total and Edit/Remove buttons */}
                  <div className="material-total">
                    <div
                      className={`total-display ${
                        material.isSelected ? "active" : "inactive"
                      }`}
                    >
                      {material.isSelected
                        ? formatPrice(material.price * material.quantity)
                        : formatPrice(0)}
                    </div>

                    <div className="material-actions">
                      <button
                        onClick={() => startEditMaterial(material)}
                        className="edit-btn"
                        title="Editar material"
                      >
                        ✏️
                      </button>

                      <button
                        onClick={() => removeMaterial(material.id)}
                        className="remove-btn"
                        title="Eliminar material"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary Footer */}
        <div className="summary-footer">
          <div className="summary-content">
            <div className="summary-stats">
              Total de materiales: {materials.length} | Seleccionados:{" "}
              {materials.filter((m) => m.isSelected).length}
            </div>
            <div className="summary-total">
              <p className="summary-total-label">Total del Presupuesto</p>
              <p className="summary-total-amount">
                {formatPrice(calculateTotal())}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
