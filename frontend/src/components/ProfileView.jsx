import { useEffect, useRef, useState } from "react"
import { Camera, LogOut, Mail, Ruler, Save, Scale, User } from "lucide-react"
import { supabase } from "../supabase"
import { getProfile, savePhoto, saveProfile, userMessage } from "../api"
import PhotoEditor from "./PhotoEditor"

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"]

const numberInputClass =
    "w-24 rounded-lg border border-sky-200 bg-white px-3 py-1.5 text-right text-sm outline-none focus:ring-2 focus:ring-sky-300 disabled:opacity-50 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"

function ProfileView() {
    const [user, setUser] = useState(null)
    const [profile, setProfile] = useState(null) 
    const [weight, setWeight] = useState("")
    const [height, setHeight] = useState("")
    const [loadError, setLoadError] = useState(null)
    const [isSaving, setIsSaving] = useState(false)
    const [saveError, setSaveError] = useState(null)
    const [saved, setSaved] = useState(false)
    const [editingFile, setEditingFile] = useState(null)
    const [photoSaving, setPhotoSaving] = useState(false)
    const [photoError, setPhotoError] = useState(null)
    const fileInput = useRef(null)

    useEffect(() => {
        let cancelled = false

        supabase.auth.getSession().then(({ data }) => {
            if (!cancelled) setUser(data.session?.user ?? null)
        })

        getProfile()
            .then((data) => {
                if (cancelled) return
                setProfile(data)
                setWeight(data.weightKg == null ? "" : String(data.weightKg))
                setHeight(data.heightCm == null ? "" : String(data.heightCm))
            })
            .catch((err) => {
                if (!cancelled) setLoadError(userMessage(err))
            })

        return () => {
            cancelled = true
        }
    }, [])

    const weightNum = weight === "" ? null : Number(weight)
    const heightNum = height === "" ? null : Number(height)
    const weightOk = weightNum === null || (weightNum >= 20 && weightNum <= 500)
    const heightOk =
        heightNum === null ||
        (Number.isInteger(heightNum) && heightNum >= 80 && heightNum <= 260)
    const changed =
        profile !== null &&
        (weightNum !== profile.weightKg || heightNum !== profile.heightCm)
    const canSave = changed && weightOk && heightOk && !isSaving

    async function handleSave(e) {
        e.preventDefault()
        if (!canSave) return

        setIsSaving(true)
        setSaveError(null)
        setSaved(false)
        try {
            const updated = await saveProfile(weightNum, heightNum)
            setProfile(updated)
            setSaved(true)
        } catch (err) {
            setSaveError(userMessage(err))
        } finally {
            setIsSaving(false)
        }
    }

    function handleFileChosen(e) {
        const file = e.target.files?.[0]
        e.target.value = "" 
        if (!file) return

        setPhotoError(null)
        if (!ALLOWED_TYPES.includes(file.type)) {
            setPhotoError("Избери снимка във формат JPEG, PNG или WebP.")
            return
        }
        setEditingFile(file)
    }

    async function handleEditorSave(dataUrl) {
        setPhotoSaving(true)
        setPhotoError(null)
        try {
            await savePhoto(dataUrl)
            setProfile((current) => ({ ...current, photo: dataUrl }))
            setEditingFile(null)
        } catch (err) {
            setPhotoError(userMessage(err))
        } finally {
            setPhotoSaving(false)
        }
    }

    async function handleRemovePhoto() {
        setPhotoError(null)
        setPhotoSaving(true)
        try {
            await savePhoto(null)
            setProfile((current) => ({ ...current, photo: null }))
        } catch (err) {
            setPhotoError(userMessage(err))
        } finally {
            setPhotoSaving(false)
        }
    }

    if (!user) {
        return <p className="py-10 text-center text-sm text-sky-600">Зареждане...</p>
    }

    const name = user.user_metadata?.full_name || user.email
    const photo = profile?.photo

    return (
        <div className="mx-auto max-w-sm">
            <div className="rounded-3xl border border-white/60 bg-white/60 p-6 shadow-lg backdrop-blur-md">
                {/* Снимка с малък бутон за камера в ъгъла */}
                <div className="flex flex-col items-center text-center">
                    <div className="relative">
                        {photo ? (
                            <img
                                src={photo}
                                alt="Профилна снимка"
                                className="h-28 w-28 rounded-full object-cover shadow ring-4 ring-white"
                            />
                        ) : (
                            <div className="flex h-28 w-28 items-center justify-center rounded-full bg-sky-100 text-sky-400 ring-4 ring-white">
                                <User size={52} />
                            </div>
                        )}
                        <button
                            type="button"
                            onClick={() => fileInput.current.click()}
                            disabled={!profile || photoSaving}
                            aria-label={photo ? "Смени снимката" : "Качи снимка"}
                            className="absolute bottom-0 right-0 flex h-9 w-9 items-center justify-center rounded-full bg-sky-500 text-white shadow-md ring-2 ring-white transition hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <Camera size={17} />
                        </button>
                        <input
                            ref={fileInput}
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={handleFileChosen}
                            className="hidden"
                        />
                    </div>

                    {photo && (
                        <button
                            type="button"
                            onClick={handleRemovePhoto}
                            disabled={photoSaving}
                            className="mt-2 text-xs text-slate-400 transition hover:text-red-500 disabled:opacity-50"
                        >
                            Махни снимката
                        </button>
                    )}
                    {photoError && !editingFile && (
                        <p className="mt-2 text-sm text-red-500">{photoError}</p>
                    )}

                    <h2 className="mt-3 max-w-full truncate text-2xl font-bold text-sky-900">
                        {name}
                    </h2>
                    <p className="mt-2 inline-flex max-w-full items-center gap-1.5 rounded-full bg-sky-50 px-3 py-1 text-sm text-sky-700">
                        <Mail size={14} className="shrink-0" />
                        <span className="truncate">{user.email}</span>
                    </p>
                </div>

                <div className="my-6 border-t border-sky-100" />

                {/* Тегло и височина: едно под друго */}
                <form onSubmit={handleSave}>
                    {loadError && (
                        <p className="mb-3 text-center text-sm text-red-500">{loadError}</p>
                    )}

                    <div className="space-y-3">
                        <label className="flex items-center justify-between gap-3 rounded-xl bg-white/70 px-4 py-2.5">
                            <span className="flex items-center gap-2 text-sm font-medium text-sky-800">
                                <Scale size={18} className="text-sky-500" /> Тегло
                            </span>
                            <span className="flex items-center gap-2">
                                <input
                                    type="number"
                                    inputMode="decimal"
                                    step="0.1"
                                    min="20"
                                    max="500"
                                    value={weight}
                                    disabled={!profile}
                                    onChange={(e) => {
                                        setWeight(e.target.value)
                                        setSaved(false)
                                    }}
                                    className={numberInputClass}
                                />
                                <span className="w-6 text-sm text-slate-400">кг</span>
                            </span>
                        </label>

                        <label className="flex items-center justify-between gap-3 rounded-xl bg-white/70 px-4 py-2.5">
                            <span className="flex items-center gap-2 text-sm font-medium text-sky-800">
                                <Ruler size={18} className="text-sky-500" /> Височина
                            </span>
                            <span className="flex items-center gap-2">
                                <input
                                    type="number"
                                    inputMode="numeric"
                                    step="1"
                                    min="80"
                                    max="260"
                                    value={height}
                                    disabled={!profile}
                                    onChange={(e) => {
                                        setHeight(e.target.value)
                                        setSaved(false)
                                    }}
                                    className={numberInputClass}
                                />
                                <span className="w-6 text-sm text-slate-400">см</span>
                            </span>
                        </label>
                    </div>

                    {(!weightOk || !heightOk) && (
                        <p className="mt-3 text-center text-xs text-red-500">
                            Теглото е между 20 и 500 кг, височината - между 80 и 260 см (цяло число).
                        </p>
                    )}
                    {saveError && (
                        <p className="mt-3 text-center text-sm text-red-500">{saveError}</p>
                    )}
                    {saved && (
                        <p className="mt-3 text-center text-sm text-emerald-600">Записано.</p>
                    )}

                    <button
                        type="submit"
                        disabled={!canSave}
                        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-sky-500 px-4 py-2.5 text-sm font-medium text-white shadow transition hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <Save size={16} /> {isSaving ? "Записване..." : "Запази"}
                    </button>
                </form>
            </div>

            <button
                onClick={() => supabase.auth.signOut()}
                className="mx-auto mt-6 flex items-center justify-center gap-2 rounded-full bg-white/70 px-5 py-2 text-sm font-medium text-slate-500 shadow transition hover:bg-red-50 hover:text-red-500"
            >
                <LogOut size={16} /> Изход
            </button>

            {editingFile && (
                <PhotoEditor
                    file={editingFile}
                    isSaving={photoSaving}
                    error={photoError}
                    onCancel={() => {
                        setEditingFile(null)
                        setPhotoError(null)
                    }}
                    onSave={handleEditorSave}
                />
            )}
        </div>
    )
}

export default ProfileView