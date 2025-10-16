'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styled from 'styled-components';
import { supabase } from '../../../../lib/supabase/client';

const Container = styled.div`
  padding: 2rem;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #e9ecef;
`;

const Title = styled.h1`
  font-size: 2rem;
  font-weight: 700;
  color: #000000;
  margin: 0;
`;

const BackButton = styled.button`
  background: #ffffff;
  border: 2px solid #000000;
  color: #000000;
  padding: 0.75rem 1.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #000000;
    color: #ffffff;
  }
`;

const SearchBar = styled.input`
  border: 2px solid #e9ecef;
  padding: 0.75rem 1rem;
  font-size: 1rem;
  width: 100%;
  max-width: 400px;
  margin-bottom: 1.5rem;

  &:focus {
    outline: none;
    border-color: #000000;
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  background: #ffffff;
  border: 2px solid #e9ecef;
`;

const Th = styled.th`
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  padding: 1rem;
  text-align: left;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  font-size: 0.875rem;
`;

const Td = styled.td`
  border: 1px solid #e9ecef;
  padding: 1rem;
`;

const Tr = styled.tr`
  &:hover {
    background: #f8f9fa;
  }
`;

const Badge = styled.span`
  background: ${props => props.active ? '#28a745' : '#6c757d'};
  color: #ffffff;
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
`;

const DeleteButton = styled.button`
  background: #dc3545;
  color: #ffffff;
  border: none;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #c82333;
  }

  &:disabled {
    background: #6c757d;
    cursor: not-allowed;
  }
`;

const Modal = styled.div`
  display: ${props => props.show ? 'flex' : 'none'};
  position: fixed;
  z-index: 1000;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  justify-content: center;
  align-items: center;
`;

const ModalContent = styled.div`
  background-color: #ffffff;
  padding: 2rem;
  border: 2px solid #000000;
  width: 90%;
  max-width: 500px;
`;

const ModalHeader = styled.h2`
  margin-top: 0;
  margin-bottom: 1rem;
  font-size: 1.5rem;
`;

const ModalBody = styled.p`
  margin-bottom: 1.5rem;
  font-size: 1rem;
  line-height: 1.5;
`;

const ModalFooter = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
`;

const ModalButton = styled.button`
  padding: 0.75rem 1.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 2px solid #000000;

  &.confirm {
    background: #dc3545;
    color: #ffffff;
    border-color: #dc3545;

    &:hover {
      background: #c82333;
      border-color: #c82333;
    }
  }

  &.cancel {
    background: #ffffff;
    color: #000000;

    &:hover {
      background: #f8f9fa;
    }
  }
`;

const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 400px;
  font-size: 1rem;
  color: #6c757d;
`;

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteModal, setDeleteModal] = useState({ show: false, user: null });
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    // Check admin authentication
    const adminAuth = sessionStorage.getItem('adminAuthenticated');
    if (adminAuth !== 'true') {
      router.push('/admin');
      return;
    }

    fetchUsers();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = users.filter(user =>
        user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users);
    }
  }, [searchQuery, users]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
      setFilteredUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('ko-KR');
  };

  const isActiveUser = (lastLogin) => {
    if (!lastLogin) return false;
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return new Date(lastLogin) > sevenDaysAgo;
  };

  const handleDeleteClick = (user) => {
    setDeleteModal({ show: true, user });
  };

  const handleDeleteCancel = () => {
    setDeleteModal({ show: false, user: null });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.user) return;

    setDeleteLoading(true);
    try {
      const response = await fetch(`/api/users/delete?id=${deleteModal.user.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-auth': 'true'
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Remove the deleted user from the list
        setUsers(users.filter(u => u.id !== deleteModal.user.id));
        setFilteredUsers(filteredUsers.filter(u => u.id !== deleteModal.user.id));
        setDeleteModal({ show: false, user: null });
        alert('사용자가 성공적으로 삭제되었습니다.');
      } else {
        alert(`삭제 실패: ${data.message || '알 수 없는 오류'}`);
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('사용자 삭제 중 오류가 발생했습니다.');
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return (
      <Container>
        <LoadingSpinner>Loading users...</LoadingSpinner>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <Title>사용자 관리</Title>
        <BackButton onClick={() => router.push('/admin')}>
          ← 돌아가기
        </BackButton>
      </Header>

      <SearchBar
        type="text"
        placeholder="사용자 검색 (아이디, 이름, 이메일)"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />

      <Table>
        <thead>
          <tr>
            <Th>아이디</Th>
            <Th>이름</Th>
            <Th>이메일</Th>
            <Th>가입일</Th>
            <Th>마지막 로그인</Th>
            <Th>상태</Th>
            <Th>작업</Th>
          </tr>
        </thead>
        <tbody>
          {filteredUsers.map(user => (
            <Tr key={user.id}>
              <Td>{user.username}</Td>
              <Td>{user.display_name || '-'}</Td>
              <Td>{user.email || '-'}</Td>
              <Td>{formatDate(user.created_at)}</Td>
              <Td>{formatDate(user.last_login)}</Td>
              <Td>
                <Badge active={isActiveUser(user.last_login)}>
                  {isActiveUser(user.last_login) ? '활성' : '비활성'}
                </Badge>
              </Td>
              <Td>
                <DeleteButton
                  onClick={() => handleDeleteClick(user)}
                  disabled={deleteLoading}
                >
                  삭제
                </DeleteButton>
              </Td>
            </Tr>
          ))}
        </tbody>
      </Table>

      {filteredUsers.length === 0 && (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#6c757d' }}>
          검색 결과가 없습니다
        </div>
      )}

      <Modal show={deleteModal.show}>
        <ModalContent>
          <ModalHeader>사용자 삭제 확인</ModalHeader>
          <ModalBody>
            정말로 사용자 <strong>{deleteModal.user?.username}</strong>님을 삭제하시겠습니까?
            <br />
            <br />
            이 작업은 되돌릴 수 없으며, 해당 사용자의 모든 데이터(포모도로 세션, 미팅 등)가 함께 삭제됩니다.
          </ModalBody>
          <ModalFooter>
            <ModalButton
              className="cancel"
              onClick={handleDeleteCancel}
              disabled={deleteLoading}
            >
              취소
            </ModalButton>
            <ModalButton
              className="confirm"
              onClick={handleDeleteConfirm}
              disabled={deleteLoading}
            >
              {deleteLoading ? '삭제 중...' : '삭제'}
            </ModalButton>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
  );
}
