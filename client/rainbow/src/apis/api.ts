import { request } from "./index.ts"
import { ILoginValues } from "../types/LoginValues";

// // all user
// export function loginAPI(loginValues: ILoginValues) {
//     return request({
//         url: "/api/authentication/login",
//         method: "POST",
//         data: loginValues,
//     });
// }

// Login API endpoint
export function loginAPI(loginValues: ILoginValues) {
  return request({
    method: 'POST',
    url: '/api/login', // Adjust URL if necessary
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

// Update a specific user
export function updateUserAPI(user: any, userId: number) {
    return request({
        url: `/api/rainbow/user/${userId}`,
        method: "PUT",
        data: user,
    })
}

// Get all meets list
export function getMeetsAPI() {
    return request({
        url: `/api/rainbow/meet`,
        method: "GET",
    });
}

// Update a specific meet
export function updateMeetAPI(meet: any) {
    return request({
        url: `/api/rainbow/meet`,
        method: "PUT",
        data: meet,
    })
}

// user
export function changePasswordAPI(oldPass: string, newPass: string, userId: number) {
    return request({
        url: `/api/rainbow/user/changePassword/${oldPass}/${newPass}/${userId}`,
        method: "PUT",
    });
}

// user
export function getUserByIdAPI(userId: number) {
    return request({
        url: `/api/rainbow/user/${userId}`,
        method: "GET",
    });
}

// admin
export function getAllUsersAPI() {
    return request({
        url: "/api/rainbow/user",
        method: "GET",
    });
}

// admin
export function addUserAPI(user: any) {
    return request({
        url: "/api/rainbow/user",
        method: "POST",
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
export function addMeetAPI(meet: any) {
    return request({
        url: `/api/rainbow/meet`,
        method: "POST",
        data: meet,
    })
}

// staff
export function deleteMeetAPI(meetId: number) {
    return request({
        url: `/api/rainbow/meet/${meetId}`,
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