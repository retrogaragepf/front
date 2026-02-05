export default function ProfileHeader() {
  return (
    <div className="bg-white border-4 border-slate-900 rounded-2xl p-6 flex items-center justify-between gap-6">
      
      <div className="flex items-center gap-6">
        
        {/* FOTO DE PERFIL */}
        <div className="relative">
          {/* 
            ⛅ Cloudinary:
            - Esta img después se reemplaza por la URL que devuelva Cloudinary
            - Mantener tamaño y clases
          */}
          <img
            src="/placeholder-avatar.png"
            alt="Foto de perfil"
            className="w-24 h-24 rounded-full object-cover border-4 border-slate-900 bg-amber-100"
          />

          {/* 
            ⛅ Cloudinary:
            - Este botón debería abrir el widget / input file
            - No lógica acá todavía
          */}
          <button
            className="absolute -bottom-2 -right-2 bg-slate-900 text-white text-xs px-3 py-1 rounded-full font-bold hover:bg-slate-800 transition"
          >
            Cambiar
          </button>
        </div>

        <div>
          <h2 className="font-display text-3xl">Alex</h2>
          <p className="font-sans text-slate-600">
            Vendedor & Comprador
          </p>
        </div>
      </div>

      <div className="hidden sm:block font-handwritten text-lg text-slate-700">
        Tu espacio personal 
      </div>
    </div>
  );
}
