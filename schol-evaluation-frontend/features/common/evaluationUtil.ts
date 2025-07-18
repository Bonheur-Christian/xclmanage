export const setTeacherCode  = (teacherCode: string) => {
    if(typeof window == "undefined") return
    localStorage.setItem('teacherCode', teacherCode)
}

export const getTeacherCode = () => {
    if(typeof window == undefined)return null
    return localStorage.getItem("teacherCode");
}