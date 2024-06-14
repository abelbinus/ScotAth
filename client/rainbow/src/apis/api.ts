import { request } from "./index.ts"
import { ILoginValues } from "../types/LoginValues";

// all user
export function loginAPI(loginValues: ILoginValues) {
    return request({
        url: "/api/authentication/login",
        method: "POST",
        data: loginValues,
    });
}

// all user
export function logoutAPI() {
    return request({
        url: "/api/authentication/logout",
        method: "GET",
    });
}

// user
export function changePasswordAPI(oldPass: string, newPass: string, userId: number) {
    return request({
        url: `/api/projectshare/user/changePassword/${oldPass}/${newPass}/${userId}`,
        method: "PUT",
    });
}

// user
export function getUserByIdAPI(userId: number) {
    return request({
        url: `/api/projectshare/user/${userId}`,
        method: "GET",
    });
}

// admin
export function getAllUsersAPI() {
    return request({
        url: "/api/projectshare/users",
        method: "GET",
    });
}

// admin
export function addUserAPI(user: any) {
    return request({
        url: "/api/projectshare/user",
        method: "POST",
        data: user,
    });
}

// admin
export function updateUserAPI(user: any) {
    return request({
        url: "/api/projectshare/user",
        method: "PUT",
        data: user,
    });
}

// admin
export function deleteUserAPI(userId: number) {
    return request({
        url: `/api/projectshare/user/${userId}`,
        method: "DELETE",
    });
}

// staff
export function getProjectsAPI(userId: number) {
    return request({
        url: `/api/projectshare/projects/${userId}`,
        method: "GET",
    });
}

// staff
export function addProjectAPI(project: any) {
    return request({
        url: `/api/projectshare/project`,
        method: "POST",
        data: project,
    })
}

// staff
export function updateProjectAPI(project: any, userId: number) {
    return request({
        url: `/api/projectshare/project/${userId}`,
        method: "PUT",
        data: project,
    })
}

// staff
export function deleteProjectAPI(projectId: number, staffId: number, userId: number) {
    return request({
        url: `/api/projectshare/project/${projectId}/${staffId}/${userId}`,
        method: "DELETE",
    })
}

// staff
export function getStaffOwnProjectsAPI(staffId: number) {
    return request({
        url: `/api/projectshare/project-allocation/staff/${staffId}`,
        method: "GET",
    });
}

// staff
export function approveProjectAPI(studentId: number, projectId: number) {
    return request({
        url: "/api/projectshare/approve-project",
        method: "POST",
        data: {
            studentId: studentId,
            projectId: projectId,
        },
    });
}

// staff
export function rejectProjectAPI(studentId: number, projectId: number) {
    return request({
        url: "/api/projectshare/reject-project",
        method: "POST",
        data: {
            studentId: studentId,
            projectId: projectId,
        },
    });
}

// student
export function getStudentAppliedProjectsAPI(studentID: number) {
    return request({
        url: `/api/projectshare/projects/student/${studentID}`,
        method: "GET",
    });
}

// student
export function applyProjectAPI(studentId: number, projectId: number) {
    return request({
        url: "/api/projectshare/apply-project",
        method: "POST",
        data: {
            studentId: studentId,
            projectId: projectId,
        },
    });
}